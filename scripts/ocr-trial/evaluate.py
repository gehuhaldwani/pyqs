# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Aggregate Kaggle OCR benchmark outputs into scripts/ocr-trial/RESULTS.md."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

DEFAULT_MODEL_ORDER = [
    "mineru",
    "glm_ocr",
    "deepseek_ocr",
    "olmocr",
    "oxr_api",
    "oxr",
    "paddle",
]

MODEL_META: dict[str, dict[str, str]] = {
    "mineru": {"label": "MinerU 2.5 (1.2B)", "params": "1.2B"},
    "glm_ocr": {"label": "GLM-OCR", "params": "0.9B"},
    "deepseek_ocr": {"label": "DeepSeek-OCR", "params": "3B (MoE)"},
    "olmocr": {"label": "olmOCR-2 (7B)", "params": "7B"},
    "oxr_api": {"label": "OXR Free API", "params": "Cloud API"},
    "oxr": {"label": "OXR (local PDF)", "params": "Cloud API"},
    "paddle": {"label": "PaddleOCR-VL-1.6", "params": "0.9B"},
}

PREFERRED_CATEGORIES = ["math", "table", "noisy", "physics", "chemistry"]


def norm_line(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def count_unclosed_latex_delimiters(md: str) -> int:
    cleaned = re.sub(r"\\\$", "", md)
    dd_count = len(re.findall(r"\$\$", cleaned))
    without_dd = cleaned.replace("$$", "")
    single_count = len(re.findall(r"\$", without_dd))
    return (dd_count % 2) + (single_count % 2)


def count_repeated_line_loops(md: str) -> int:
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


def find_model_md(model_dir: Path, stem: str) -> Path | None:
    direct = model_dir / f"{stem}.md"
    if direct.exists():
        return direct
    nested = model_dir / stem / f"{stem}.md"
    if nested.exists():
        return nested
    return None


def discover_models(out_dir: Path, metrics: dict[str, dict]) -> list[str]:
    found: set[str] = set(metrics.keys())
    if out_dir.exists():
        for child in out_dir.iterdir():
            if not child.is_dir():
                continue
            if child.name in {"samples", "samples_hard", "pages", "haiku"}:
                continue
            if any(child.rglob("*.md")):
                found.add(child.name)
    ordered = [m for m in DEFAULT_MODEL_ORDER if m in found]
    for m in sorted(found):
        if m not in ordered:
            ordered.append(m)
    return ordered


def load_sample_manifest(out_dir: Path) -> dict[str, dict]:
    """Load manifest entries keyed by sample stem."""
    combined: dict[str, dict] = {}
    for sub in ("samples_hard", "samples"):
        mf = out_dir / sub / "manifest.json"
        if not mf.exists():
            continue
        try:
            raw = json.loads(mf.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for png_name, val in raw.items():
            stem = Path(png_name).stem
            if isinstance(val, dict):
                combined[stem] = {
                    "png": png_name,
                    "source_dir": sub,
                    **val,
                }
            else:
                combined[stem] = {
                    "png": png_name,
                    "source_dir": sub,
                    "pdf": str(val),
                    "page": 0,
                    "category": "general",
                }
    return combined


def pick_representative_samples(
    manifest: dict[str, dict],
    models: list[str],
    out_dir: Path,
    max_samples: int = 5,
) -> list[str]:
    """Pick 3-5 diverse hard samples prioritizing math, table, and noisy-scan categories."""
    if manifest:
        candidates = list(manifest.keys())
    else:
        stems: set[str] = set()
        for m in models:
            mdir = out_dir / m
            if mdir.exists():
                for md in mdir.rglob("*.md"):
                    stems.add(md.stem)
        candidates = sorted(stems)

    if not candidates:
        return []

    def coverage(stem: str) -> int:
        return sum(1 for m in models if find_model_md(out_dir / m, stem) is not None)

    picked: list[str] = []
    # First pick best-covered sample from each preferred category.
    for cat in PREFERRED_CATEGORIES:
        cat_matches = [
            s
            for s in candidates
            if s not in picked and cat in str(manifest.get(s, {}).get("category", "")).lower()
        ]
        if cat_matches:
            cat_matches.sort(key=lambda s: (-coverage(s), s))
            picked.append(cat_matches[0])
        if len(picked) >= max_samples:
            return picked

    # Fill remaining slots up to max_samples by model coverage.
    remaining = [s for s in candidates if s not in picked]
    remaining.sort(key=lambda s: (-coverage(s), s))
    picked.extend(remaining[: max(0, max_samples - len(picked))])
    return picked


def compute_summary_rows(
    models: list[str],
    out_dir: Path,
    metrics: dict[str, dict],
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for m in models:
        mdir = out_dir / m
        m_files = sorted(mdir.rglob("*.md")) if mdir.exists() else []
        empty_pages = 0
        broken_latex = 0
        loops = 0
        for f in m_files:
            txt = f.read_text(encoding="utf-8")
            if not txt.strip():
                empty_pages += 1
            else:
                broken_latex += count_unclosed_latex_delimiters(txt)
                loops += count_repeated_line_loops(txt)

        rec = metrics.get(m, {})
        meta = MODEL_META.get(m, {"label": m, "params": str(rec.get("params", "N/A"))})
        vram = rec.get("peak_vram_mb")
        sec_per_page = rec.get("avg_sec_per_page")

        rows.append(
            {
                "model": meta["label"],
                "params": str(rec.get("params", meta["params"])),
                "vram": f"{vram:.1f} MB" if isinstance(vram, (int, float)) and vram > 0 else "N/A",
                "sec_per_page": (
                    f"{sec_per_page:.2f}s"
                    if isinstance(sec_per_page, (int, float)) and sec_per_page > 0
                    else "N/A"
                ),
                "empty_pages": str(rec.get("empty_pages", empty_pages) if not m_files else empty_pages),
                "broken_latex": str(
                    rec.get("unclosed_latex_delimiters", broken_latex)
                    if not m_files
                    else broken_latex
                ),
                "loops": str(rec.get("repeated_line_loops", loops) if not m_files else loops),
                "pages": str(len(m_files) or rec.get("pages_completed", 0)),
            }
        )
    return rows


def trim_snippet(text: str, max_lines: int = 24, max_chars: int = 1200) -> str:
    stripped = text.strip()
    if not stripped:
        return "_(empty output)_"
    lines = stripped.splitlines()
    clipped = lines[:max_lines]
    out = "\n".join(clipped)
    if len(out) > max_chars:
        out = out[:max_chars].rstrip() + "\n... (truncated)"
    elif len(lines) > max_lines:
        out += f"\n... ({len(lines) - max_lines} more lines)"
    return out


def render_results_md(
    out_dir: Path,
    metrics: dict[str, dict],
    models: list[str],
    manifest: dict[str, dict],
    samples: list[str],
) -> str:
    lines: list[str] = [
        "# OCR Model Benchmark Results (Issue #208)",
        "",
        "Evaluation across GEHU PYQ sample pages (200 DPI) targeting Engineering Mathematics, "
        "Physics/Chemistry formulas, complex tables, and noisy hand-scanned papers on Kaggle `2 x Tesla T4` (FP16).",
        "",
        "## Summary Comparison",
        "",
    ]

    if not models:
        lines.extend(
            [
                "_No model outputs or `metrics.json` found under `scripts/ocr-trial/out/` yet._",
                "",
                "Run `scripts/ocr-trial/benchmark_kaggle.py` on Kaggle T4 GPUs, download `out/` back into "
                "`scripts/ocr-trial/out/`, and re-run `python scripts/ocr-trial/evaluate.py`.",
                "",
            ]
        )
        return "\n".join(lines)

    rows = compute_summary_rows(models, out_dir, metrics)
    lines.extend(
        [
            "| Model | Parameters | T4 VRAM Peak | Sec/Page | Empty Pages | Broken LaTeX Count | Hallucination Loops | Pages |",
            "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
        ]
    )
    for r in rows:
        lines.append(
            f"| {r['model']} | {r['params']} | {r['vram']} | {r['sec_per_page']} | "
            f"{r['empty_pages']} | {r['broken_latex']} | {r['loops']} | {r['pages']} |"
        )
    lines.append("")

    if samples:
        lines.extend(["## Side-by-Side Hard Sample Snippets", ""])
        for idx, stem in enumerate(samples, 1):
            info = manifest.get(stem, {})
            cat = info.get("category", "sample")
            pdf = info.get("pdf", stem)
            page = info.get("page", 0)
            lines.append(f"### {idx}. `{stem}` (`{cat}`)")
            lines.append("")
            lines.append(f"- Source: `{pdf}` (page index `{page}`)")
            lines.append("")
            for m in models:
                label = MODEL_META.get(m, {}).get("label", m)
                md_path = find_model_md(out_dir / m, stem)
                lines.append(f"#### {label}")
                lines.append("")
                if md_path is None:
                    lines.append("_(not run)_")
                else:
                    snippet = trim_snippet(md_path.read_text(encoding="utf-8"))
                    lines.append("```markdown")
                    lines.append(snippet.replace("```", "~~~"))
                    lines.append("```")
                lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description="Evaluate OCR benchmark outputs and generate RESULTS.md.")
    ap.add_argument("--out-dir", type=Path, default=here / "out")
    ap.add_argument("--output", type=Path, default=here / "RESULTS.md")
    ap.add_argument("--max-samples", type=int, default=5)
    args = ap.parse_args()

    metrics_path = args.out_dir / "metrics.json"
    metrics: dict[str, dict] = {}
    if metrics_path.exists():
        try:
            metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            metrics = {}

    models = discover_models(args.out_dir, metrics)
    manifest = load_sample_manifest(args.out_dir)
    samples = pick_representative_samples(manifest, models, args.out_dir, args.max_samples)
    report = render_results_md(args.out_dir, metrics, models, manifest, samples)
    args.output.write_text(report, encoding="utf-8", newline="\n")
    print(f"Wrote {args.output} ({len(models)} models, {len(samples)} sample comparisons)")


if __name__ == "__main__":
    main()
