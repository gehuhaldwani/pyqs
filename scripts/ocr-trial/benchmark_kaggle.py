# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "torch",
#   "transformers>=4.56.0",
#   "accelerate",
#   "pillow",
#   "httpx",
# ]
# ///
"""Kaggle 2xT4 (16 GB VRAM, Turing FP16) OCR model benchmark runner.

Runs each selected OCR model sequentially over a directory of sample page PNGs,
forces torch.float16 everywhere (no bfloat16 or FP8), checkpoints per-page
markdown outputs to out/<model>/<sample_stem>.md for session-timeout resume,
unloads GPU memory between models, and writes summary metrics to out/metrics.json.

Install on Kaggle (run in a notebook cell before invoking):
    pip install -q "transformers>=4.56.0" accelerate pillow httpx pypdfium2
    pip install -q "mineru-vl-utils[transformers]" loguru einops addict easydict torchvision
    pip install -q olmocr --no-deps
"""

from __future__ import annotations

import argparse
import contextlib
import gc
import io
import json
import os
import re
import tempfile
import time
import traceback
from pathlib import Path
from typing import Callable

from PIL import Image

OXR_URL = "https://free-oxr.somark.ai/api/v1/parse/sync"

MODEL_INFO: dict[str, dict[str, str]] = {
    "mineru": {
        "repo": "opendatalab/MinerU2.5-2509-1.2B",
        "params": "1.2B",
    },
    "glm_ocr": {
        "repo": "zai-org/GLM-OCR",
        "params": "0.9B",
    },
    "deepseek_ocr": {
        "repo": "deepseek-ai/DeepSeek-OCR",
        "params": "3B (MoE)",
    },
    "olmocr": {
        "repo": "allenai/olmOCR-2-7B-1025",
        "params": "7B",
    },
    "oxr_api": {
        "repo": "free-oxr.somark.ai/api/v1/parse/sync",
        "params": "Cloud API",
    },
}

DEFAULT_MODELS = list(MODEL_INFO.keys())

OLMOCR_FALLBACK_PROMPT = (
    "Attached is one page of a document that you must process. "
    "Just return the plain text representation of this document as if you were reading it naturally. "
    "Convert equations to LaTeX and tables to HTML. "
    "Return your output as markdown."
)


def norm_line(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def count_unclosed_latex_delimiters(md: str) -> int:
    """Count unclosed $$ and $ delimiter parity errors in a markdown page."""
    cleaned = re.sub(r"\\\$", "", md)
    dd_count = len(re.findall(r"\$\$", cleaned))
    without_dd = cleaned.replace("$$", "")
    single_count = len(re.findall(r"\$", without_dd))
    return (dd_count % 2) + (single_count % 2)


def count_repeated_line_loops(md: str) -> int:
    """Count consecutive duplicate non-empty lines with >= 30 normalized chars."""
    loops = 0
    prev = ""
    for ln in md.splitlines():
        n = norm_line(ln)
        if not n:
            continue
        if len(n) >= 30 and n == prev:
            loops += 1
        prev = n
    return loops


def reset_cuda_peak_memory() -> None:
    import torch

    if not (torch.cuda.is_available() and torch.cuda.is_initialized()):
        return
    for idx in range(torch.cuda.device_count()):
        try:
            torch.cuda.reset_peak_memory_stats(idx)
        except RuntimeError:
            pass


def get_cuda_peak_vram_mb() -> float:
    import torch

    if not (torch.cuda.is_available() and torch.cuda.is_initialized()):
        return 0.0
    total_bytes = 0
    for idx in range(torch.cuda.device_count()):
        try:
            total_bytes += torch.cuda.max_memory_allocated(idx)
        except RuntimeError:
            pass
    return round(total_bytes / (1024 * 1024), 1)


def _cuda_autocast():
    import torch

    if torch.cuda.is_available():
        return torch.autocast("cuda", dtype=torch.float16)
    return contextlib.nullcontext()


def cleanup_cuda(*objs: object) -> None:
    for obj in objs:
        del obj
    gc.collect()
    try:
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
    except ImportError:
        pass


def force_fp16(model: object) -> object:
    """Ensure model weights and buffers stay in float16 (T4 lacks native BF16/FP8)."""
    import torch

    if hasattr(model, "to"):
        model = model.to(dtype=torch.float16)
    return model


def _strip_yaml_frontmatter(text: str) -> str:
    """Strip leading YAML frontmatter emitted by olmOCR prompts if present."""
    stripped = text.lstrip()
    if not stripped.startswith("---"):
        return text
    parts = stripped.split("---", 2)
    if len(parts) == 3:
        return parts[2].lstrip("\r\n")
    return text


def _blocks_to_markdown(blocks: object) -> str:
    """Convert MinerU ContentBlock list into markdown, using json2md when available."""
    try:
        from mineru_vl_utils.post_process import json2md

        return str(json2md(blocks))
    except Exception:
        pass

    if isinstance(blocks, str):
        return blocks
    if not isinstance(blocks, list):
        return str(blocks)

    parts: list[str] = []
    for block in blocks:
        if not isinstance(block, dict):
            parts.append(str(block))
            continue
        btype = str(block.get("type", "text"))
        content = block.get("content")
        if not content:
            if btype == "image":
                parts.append("[figure]")
            continue
        text = str(content).strip()
        if btype == "equation" and not text.startswith("$$"):
            parts.append(f"$$\n{text}\n$$")
        else:
            parts.append(text)
    return "\n\n".join(parts)


def run_mineru(images: list[Path], model_dir: Path, timings: dict[str, float]) -> None:
    import torch
    from mineru_vl_utils import MinerUClient
    from transformers import AutoProcessor, Qwen2VLForConditionalGeneration

    repo = MODEL_INFO["mineru"]["repo"]
    print(f"[mineru] Loading {repo} in torch.float16...", flush=True)
    processor = AutoProcessor.from_pretrained(repo, use_fast=True)
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        repo,
        torch_dtype=torch.float16,
        device_map="auto",
        attn_implementation="sdpa",
    )
    model = force_fp16(model).eval()
    client = MinerUClient(backend="transformers", model=model, processor=processor)

    try:
        for img_path in images:
            dest = model_dir / f"{img_path.stem}.md"
            if dest.exists():
                continue
            t0 = time.perf_counter()
            with Image.open(img_path) as im:
                rgb = im.convert("RGB")
                with torch.inference_mode(), _cuda_autocast():
                    blocks = client.two_step_extract(rgb)
            md = _blocks_to_markdown(blocks)
            elapsed = round(time.perf_counter() - t0, 3)
            dest.write_text(md, encoding="utf-8", newline="\n")
            timings[img_path.stem] = elapsed
            print(f"[mineru] {img_path.name}: {elapsed:.2f}s ({len(md)} chars)", flush=True)
    finally:
        cleanup_cuda(client, model, processor)


def run_glm_ocr(images: list[Path], model_dir: Path, timings: dict[str, float]) -> None:
    import torch
    from transformers import AutoModelForImageTextToText, AutoProcessor

    repo = MODEL_INFO["glm_ocr"]["repo"]
    print(f"[glm_ocr] Loading {repo} in torch.float16...", flush=True)
    processor = AutoProcessor.from_pretrained(repo, trust_remote_code=True)

    # Prefer dedicated GlmOcr class when available in installed transformers, else AutoModelForImageTextToText.
    try:
        from transformers import GlmOcrForConditionalGeneration

        model_cls = GlmOcrForConditionalGeneration
    except ImportError:
        model_cls = AutoModelForImageTextToText

    model = model_cls.from_pretrained(
        repo,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    model = force_fp16(model).eval()

    try:
        for img_path in images:
            dest = model_dir / f"{img_path.stem}.md"
            if dest.exists():
                continue
            t0 = time.perf_counter()
            with Image.open(img_path) as im:
                rgb = im.convert("RGB")
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "image": rgb},
                            {"type": "text", "text": "Text Recognition:"},
                        ],
                    }
                ]
                inputs = processor.apply_chat_template(
                    messages,
                    tokenize=True,
                    add_generation_prompt=True,
                    return_dict=True,
                    return_tensors="pt",
                )
                target_device = next(model.parameters()).device
                inputs = {
                    k: (
                        v.to(device=target_device, dtype=torch.float16)
                        if torch.is_tensor(v) and v.is_floating_point()
                        else (v.to(target_device) if torch.is_tensor(v) else v)
                    )
                    for k, v in inputs.items()
                }
                with torch.inference_mode(), _cuda_autocast():
                    out_ids = model.generate(**inputs, max_new_tokens=4096, do_sample=False)
                prompt_len = inputs["input_ids"].shape[1]
                gen_ids = out_ids[0][prompt_len:]
                md = processor.decode(gen_ids, skip_special_tokens=True).strip()
            elapsed = round(time.perf_counter() - t0, 3)
            dest.write_text(md, encoding="utf-8", newline="\n")
            timings[img_path.stem] = elapsed
            print(f"[glm_ocr] {img_path.name}: {elapsed:.2f}s ({len(md)} chars)", flush=True)
    finally:
        cleanup_cuda(model, processor)


def run_deepseek_ocr(images: list[Path], model_dir: Path, timings: dict[str, float]) -> None:
    import torch
    import transformers
    from transformers import AutoConfig, AutoModel, AutoTokenizer

    repo = MODEL_INFO["deepseek_ocr"]["repo"]
    print(
        f"[deepseek_ocr] Loading {repo} in torch.float16 (transformers=={transformers.__version__})...",
        flush=True,
    )
    # DeepSeek-OCR remote code imports removed helpers on transformers >= 5.
    try:
        import transformers.models.llama.modeling_llama as _llama_mod

        fallback_attn = getattr(_llama_mod, "LlamaAttention", torch.nn.Module)
        for _attr in ("LlamaFlashAttention2", "LlamaSdpaAttention", "LlamaAttention"):
            if not hasattr(_llama_mod, _attr):
                setattr(_llama_mod, _attr, fallback_attn)
    except ImportError:
        pass
    try:
        import transformers.utils.import_utils as _import_utils

        if not hasattr(_import_utils, "is_torch_fx_available"):
            _import_utils.is_torch_fx_available = lambda: False
        if not hasattr(_import_utils, "is_torch_greater_or_equal_than_1_13"):
            _import_utils.is_torch_greater_or_equal_than_1_13 = lambda: True
    except ImportError:
        pass
    try:
        from transformers.cache_utils import DynamicCache

        if not hasattr(DynamicCache, "seen_tokens"):
            DynamicCache.seen_tokens = property(lambda self: self.get_seq_length())
    except ImportError:
        pass

    tokenizer = AutoTokenizer.from_pretrained(repo, trust_remote_code=True)
    config = AutoConfig.from_pretrained(repo, trust_remote_code=True)
    fallback_pad = getattr(tokenizer, "pad_token_id", None)
    if fallback_pad is None:
        fallback_pad = getattr(config, "eos_token_id", 1)
    for cfg in (config, getattr(config, "language_config", None)):
        if cfg is not None and getattr(cfg, "pad_token_id", None) is None:
            cfg.pad_token_id = fallback_pad

    # Use eager/sdpa on T4 (sm_75); flash_attention_2 requires Ampere (sm_80+).
    model = AutoModel.from_pretrained(
        repo,
        config=config,
        _attn_implementation="eager",
        torch_dtype=torch.float16,
        trust_remote_code=True,
        use_safetensors=True,
    )
    model = force_fp16(model).eval()
    if torch.cuda.is_available():
        model = model.cuda()

    prompt = "<image>\n<|grounding|>Convert the document to markdown. "
    try:
        for img_path in images:
            dest = model_dir / f"{img_path.stem}.md"
            if dest.exists():
                continue
            t0 = time.perf_counter()
            with tempfile.TemporaryDirectory() as tmpdir:
                with torch.inference_mode(), _cuda_autocast():
                    res = model.infer(
                        tokenizer,
                        prompt=prompt,
                        image_file=str(img_path),
                        output_path=tmpdir,
                        base_size=1024,
                        image_size=640,
                        crop_mode=True,
                        save_results=True,
                        test_compress=False,
                    )
                mmd = Path(tmpdir) / "result.mmd"
                if mmd.exists():
                    md = mmd.read_text(encoding="utf-8").strip()
                elif isinstance(res, str):
                    md = res.strip()
                else:
                    md = ""
            elapsed = round(time.perf_counter() - t0, 3)
            dest.write_text(md, encoding="utf-8", newline="\n")
            timings[img_path.stem] = elapsed
            print(f"[deepseek_ocr] {img_path.name}: {elapsed:.2f}s ({len(md)} chars)", flush=True)
    finally:
        cleanup_cuda(model, tokenizer)


def run_olmocr(images: list[Path], model_dir: Path, timings: dict[str, float]) -> None:
    import torch
    from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

    repo = MODEL_INFO["olmocr"]["repo"]
    print(f"[olmocr] Loading {repo} in torch.float16 across available GPUs...", flush=True)
    try:
        from olmocr.prompts import build_no_anchoring_v4_yaml_prompt

        prompt = build_no_anchoring_v4_yaml_prompt()
    except Exception:
        prompt = OLMOCR_FALLBACK_PROMPT

    processor = AutoProcessor.from_pretrained(repo)
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        repo,
        torch_dtype=torch.float16,
        device_map="auto",
        attn_implementation="sdpa",
    )
    model = force_fp16(model).eval()

    try:
        for img_path in images:
            dest = model_dir / f"{img_path.stem}.md"
            if dest.exists():
                continue
            t0 = time.perf_counter()
            with Image.open(img_path) as im:
                rgb = im.convert("RGB")
                # olmOCR-2 expects longest image edge <= 1288px for optimal aspect tokenization.
                longest = max(rgb.size)
                if longest > 1288:
                    scale = 1288 / longest
                    rgb = rgb.resize(
                        (int(rgb.width * scale), int(rgb.height * scale)),
                        Image.Resampling.LANCZOS,
                    )
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "image": rgb},
                            {"type": "text", "text": prompt},
                        ],
                    }
                ]
                text_input = processor.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=True
                )
                inputs = processor(
                    text=[text_input],
                    images=[rgb],
                    padding=True,
                    return_tensors="pt",
                )
                target_device = next(model.parameters()).device
                inputs = {
                    k: (
                        v.to(device=target_device, dtype=torch.float16)
                        if torch.is_tensor(v) and v.is_floating_point()
                        else (v.to(target_device) if torch.is_tensor(v) else v)
                    )
                    for k, v in inputs.items()
                }
                with torch.inference_mode(), _cuda_autocast():
                    generated_ids = model.generate(
                        **inputs,
                        max_new_tokens=3072,
                        do_sample=False,
                    )
                trimmed = generated_ids[0][inputs["input_ids"].shape[1] :]
                raw_out = processor.decode(
                    trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
                )
                md = _strip_yaml_frontmatter(raw_out).strip()
            elapsed = round(time.perf_counter() - t0, 3)
            dest.write_text(md, encoding="utf-8", newline="\n")
            timings[img_path.stem] = elapsed
            print(f"[olmocr] {img_path.name}: {elapsed:.2f}s ({len(md)} chars)", flush=True)
    finally:
        cleanup_cuda(model, processor)


def run_oxr_api(images: list[Path], model_dir: Path, timings: dict[str, float]) -> None:
    """Call OXR free API with a single-page PDF wrapper and exponential backoff."""
    import httpx

    print(f"[oxr_api] Calling {OXR_URL}...", flush=True)
    with httpx.Client(timeout=300) as client:
        for img_path in images:
            dest = model_dir / f"{img_path.stem}.md"
            if dest.exists():
                continue
            t0 = time.perf_counter()
            buf = io.BytesIO()
            with Image.open(img_path) as im:
                im.convert("RGB").save(buf, format="PDF")
            pdf_bytes = buf.getvalue()

            md = None
            last_err = ""
            for attempt in range(5):
                try:
                    r = client.post(
                        OXR_URL,
                        files={"file": (f"{img_path.stem}.pdf", pdf_bytes, "application/pdf")},
                        data={"api_key": "dummy", "output_formats": "markdown"},
                    )
                    body = r.json()
                    if r.status_code == 200 and body.get("code") == 0:
                        md = body["data"]["result"]["outputs"]["markdown"]
                        break
                    last_err = f"status={r.status_code} body={str(body)[:200]}"
                except (httpx.HTTPError, ValueError) as exc:
                    last_err = str(exc)
                wait_s = 15 * (2**attempt)
                print(
                    f"[oxr_api] {img_path.name} retry {attempt + 1}/5 in {wait_s}s ({last_err})",
                    flush=True,
                )
                time.sleep(wait_s)

            if md is None:
                print(f"[oxr_api] FAILED {img_path.name}: {last_err}", flush=True)
                continue

            elapsed = round(time.perf_counter() - t0, 3)
            dest.write_text(md, encoding="utf-8", newline="\n")
            timings[img_path.stem] = elapsed
            print(f"[oxr_api] {img_path.name}: {elapsed:.2f}s ({len(md)} chars)", flush=True)


RUNNERS: dict[str, Callable[[list[Path], Path, dict[str, float]], None]] = {
    "mineru": run_mineru,
    "glm_ocr": run_glm_ocr,
    "deepseek_ocr": run_deepseek_ocr,
    "olmocr": run_olmocr,
    "oxr_api": run_oxr_api,
}


def compute_model_metrics(
    model_name: str,
    images: list[Path],
    model_dir: Path,
    timings: dict[str, float],
    peak_vram_mb: float,
) -> dict[str, object]:
    empty_pages = 0
    unclosed_latex = 0
    repeated_loops = 0
    completed = 0
    total_sec = 0.0

    for img in images:
        md_path = model_dir / f"{img.stem}.md"
        if not md_path.exists():
            continue
        completed += 1
        text = md_path.read_text(encoding="utf-8")
        if not text.strip():
            empty_pages += 1
        else:
            unclosed_latex += count_unclosed_latex_delimiters(text)
            repeated_loops += count_repeated_line_loops(text)
        total_sec += timings.get(img.stem, 0.0)

    avg_sec = round(total_sec / completed, 3) if completed else 0.0
    return {
        "model": model_name,
        "repo": MODEL_INFO[model_name]["repo"],
        "params": MODEL_INFO[model_name]["params"],
        "pages_completed": completed,
        "pages_total": len(images),
        "avg_sec_per_page": avg_sec,
        "total_sec": round(total_sec, 3),
        "peak_vram_mb": peak_vram_mb,
        "empty_pages": empty_pages,
        "unclosed_latex_delimiters": unclosed_latex,
        "repeated_line_loops": repeated_loops,
    }


def parse_models_arg(raw_models: list[str]) -> list[str]:
    selected: list[str] = []
    for item in raw_models:
        for part in item.split(","):
            name = part.strip()
            if not name:
                continue
            if name == "all":
                return list(DEFAULT_MODELS)
            if name not in RUNNERS:
                raise SystemExit(
                    f"Unknown model {name!r}. Available: {', '.join(DEFAULT_MODELS)}"
                )
            if name not in selected:
                selected.append(name)
    return selected or list(DEFAULT_MODELS)


def collect_images(samples_dir: Path, limit: int) -> list[Path]:
    exts = {".png", ".jpg", ".jpeg", ".webp"}
    images = sorted(
        p for p in samples_dir.rglob("*") if p.is_file() and p.suffix.lower() in exts
    )
    if limit > 0:
        images = images[:limit]
    return images


def _default_paths() -> tuple[Path, Path]:
    """Resolve default samples and output directories for both CLI scripts and Kaggle notebooks."""
    base_dir = Path(__file__).resolve().parent if "__file__" in globals() else Path.cwd()
    local_samples = base_dir / "out" / "samples_hard"
    local_out = base_dir / "out"

    kaggle_input = Path("/kaggle/input")
    kaggle_working = Path("/kaggle/working")
    if not local_samples.exists() and kaggle_input.exists():
        found_hard = next(
            (p for p in sorted(kaggle_input.rglob("samples_hard")) if p.is_dir()),
            None,
        )
        default_samples = found_hard if found_hard is not None else kaggle_input
    else:
        default_samples = local_samples

    if "__file__" not in globals() and kaggle_working.exists():
        default_out = kaggle_working / "out"
    else:
        default_out = local_out
    return default_samples, default_out


def main(argv: list[str] | None = None) -> None:
    default_samples, default_out = _default_paths()
    ap = argparse.ArgumentParser(description="Benchmark OCR VLMs on Kaggle 2xT4.")
    ap.add_argument(
        "--models",
        nargs="+",
        default=["all"],
        help=f"Models to run (default: all). Choices: {', '.join(DEFAULT_MODELS)}",
    )
    ap.add_argument(
        "--samples-dir",
        type=Path,
        default=default_samples,
        help="Directory containing sample page PNGs (recursively scanned).",
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=default_out,
        help="Base output directory for per-model markdowns and metrics.json.",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional cap on number of sample images (0 = all).",
    )
    # parse_known_args ignores IPython/Jupyter kernel flags like `-f kernel.json`.
    args, _ = ap.parse_known_args(argv)

    # Keep HuggingFace caches under /kaggle/working if present and writable, or default.
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    models = parse_models_arg(args.models)
    images = collect_images(args.samples_dir, args.limit)
    if not images:
        raise SystemExit(f"No sample images found under {args.samples_dir}")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = args.out_dir / "metrics.json"
    all_metrics: dict[str, dict[str, object]] = {}
    if metrics_path.exists():
        try:
            all_metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            all_metrics = {}

    print(
        f"Running models={models} on {len(images)} images from {args.samples_dir}",
        flush=True,
    )
    try:
        import torch

        if torch.cuda.is_available():
            gpus = [torch.cuda.get_device_name(i) for i in range(torch.cuda.device_count())]
            print(f"CUDA available: {len(gpus)} GPU(s) {gpus}", flush=True)
        else:
            print("WARNING: CUDA not available; running on CPU.", flush=True)
    except ImportError:
        pass

    for model_name in models:
        model_dir = args.out_dir / model_name
        model_dir.mkdir(parents=True, exist_ok=True)
        timings_path = model_dir / "_timings.json"
        timings: dict[str, float] = {}
        if timings_path.exists():
            try:
                timings = json.loads(timings_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                timings = {}

        pending = [img for img in images if not (model_dir / f"{img.stem}.md").exists()]
        prev_vram = float(all_metrics.get(model_name, {}).get("peak_vram_mb", 0.0))
        peak_vram = prev_vram

        model_error: str | None = None
        if pending:
            try:
                if model_name != "oxr_api":
                    reset_cuda_peak_memory()
                RUNNERS[model_name](images, model_dir, timings)
                if model_name != "oxr_api":
                    peak_vram = max(prev_vram, get_cuda_peak_vram_mb())
            except Exception as exc:
                model_error = f"{type(exc).__name__}: {exc}"
                print(f"[{model_name}] ERROR: {model_error}", flush=True)
                traceback.print_exc()
                cleanup_cuda()
            finally:
                timings_path.write_text(
                    json.dumps(timings, indent=2, sort_keys=True),
                    encoding="utf-8",
                    newline="\n",
                )
        else:
            print(f"[{model_name}] All {len(images)} outputs already cached; skipping.", flush=True)

        m_rec = compute_model_metrics(model_name, images, model_dir, timings, peak_vram)
        if model_error is not None:
            m_rec["error"] = model_error
        all_metrics[model_name] = m_rec
        metrics_path.write_text(
            json.dumps(all_metrics, indent=2),
            encoding="utf-8",
            newline="\n",
        )
        print(f"[{model_name}] Metrics: {all_metrics[model_name]}", flush=True)


if __name__ == "__main__":
    main()
