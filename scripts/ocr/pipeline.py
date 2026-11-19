# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "pypdfium2", "pillow"]
# ///
"""OCR the PDFs in pyqs/ into markdown under ocr/, mirroring the folder layout.

Stages per PDF: OXR free API, a Haiku check via `claude -p`, safe patches, math cleanup.
Resumable: a PDF with an existing ocr/<path>.md is skipped, and the raw OXR text is cached.
Outputs per PDF: <name>.md (final), <name>.oxr.md (raw OXR), <name>.patches.json (audit log).
"""
import argparse
import difflib
import hashlib
import json
import random
import re
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import httpx
import pypdfium2 as pdfium

REPO = Path(__file__).resolve().parents[2]
PYQS = REPO / "pyqs"
OUT = REPO / "ocr"
CACHE = OUT / ".cache"
OXR_URL = "https://free-oxr.somark.ai/api/v1/parse/sync"
MAX_VERIFY_PAGES = 6

PROMPT = """Check an OCR transcription against the page images of an exam paper.
Page images: {images}
OCR markdown: {md}
Read the markdown and every page image with the Read tool.
Find only real errors: text on the page that is missing from the markdown, wrong words, numbers or math, or lines in the wrong order.
Rules:
- Transcribe exactly as printed. Do not correct spelling or grammar mistakes that are printed on the page.
- Ignore marks lines (like "(10 Marks)"), CO tags, headers, logos, formatting and whitespace.
- For "wrong", "ocr" must be an exact substring of the markdown and "correct" the replacement text only, with no explanation.
- For "missing", "after" must be an exact short quote of the markdown line the text follows, and "correct" the missing text only.
- Never return an empty "correct".
Reply with JSON only, no prose:
{{"issues":[{{"kind":"missing|wrong|order","page":1,"after":"...","ocr":"...","correct":"..."}}]}}
Use {{"issues":[]}} if the transcription is faithful."""

TRIVIAL = re.compile(
    r"^[\(\s]*(\d+\s*[x×X]\s*\d+\s*=\s*)?\d+\s*marks?[\)\s]*(CO\s?\d)?$|^[\(\s]*CO\s?\d[\)\s]*$",
    re.I,
)

lock = threading.Lock()
stop = threading.Event()
haiku_fails = 0


def paths(pdf: Path) -> dict[str, Path]:
    rel = pdf.relative_to(PYQS)
    base = OUT / rel.parent / rel.stem
    return {
        "final": base.with_name(base.name + ".md"),
        "oxr": base.with_name(base.name + ".oxr.md"),
        "log": base.with_name(base.name + ".patches.json"),
    }


def run_oxr(pdf: Path) -> str:
    for attempt in range(5):
        try:
            with httpx.Client(timeout=300) as c, open(pdf, "rb") as f:
                r = c.post(
                    OXR_URL,
                    files={"file": (pdf.name, f, "application/pdf")},
                    data={"api_key": "dummy", "output_formats": "markdown"},
                )
            body = r.json()
            if r.status_code == 200 and body.get("code") == 0:
                return body["data"]["result"]["outputs"]["markdown"]
        except (httpx.HTTPError, ValueError):
            pass
        time.sleep(15 * (attempt + 1))
    raise RuntimeError("OXR failed after retries")


def run_haiku(images: list[str], md_path: Path) -> tuple[list[dict], float]:
    r = subprocess.run(
        [
            "claude", "-p", "--model", "haiku", "--output-format", "json",
            "--tools", "Read", "--allowedTools", "Read",
            "--system-prompt", "You verify OCR output against a source document.",
            "--setting-sources", "", "--strict-mcp-config", "--disable-slash-commands",
            "--no-session-persistence",
        ],
        input=PROMPT.format(images=", ".join(images), md=md_path),
        capture_output=True, text=True, encoding="utf-8", cwd=REPO, timeout=600,
    )
    d = json.loads(r.stdout)
    if d.get("is_error"):
        raise RuntimeError(str(d.get("result"))[:200])
    text = d["result"]
    data = json.loads(text[text.index("{"): text.rindex("}") + 1])
    return data["issues"], float(d.get("total_cost_usd", 0))


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def apply_patches(md: str, issues: list[dict]) -> tuple[str, list[dict], list[dict]]:
    applied, review = [], []
    for it in issues:
        kind = it.get("kind")
        correct = (it.get("correct") or "").strip()
        ocr = (it.get("ocr") or "").strip()
        after = (it.get("after") or "").strip()
        if not correct or (kind != "wrong" and (TRIVIAL.match(correct) or len(correct) < 5)):
            review.append({**it, "why": "empty or marks/CO line"})
            continue
        if kind == "missing" and after:
            lines = md.split("\n")
            hits = [i for i, ln in enumerate(lines) if norm(after) in norm(ln)]
            if len(hits) == 1 and norm(correct) not in norm(md):
                lines.insert(hits[0] + 1, "\n" + correct)
                md = "\n".join(lines)
                applied.append(it)
            else:
                review.append({**it, "why": "anchor not unique or text already present"})
        elif kind == "wrong" and ocr and md.count(ocr) == 1:
            close = difflib.SequenceMatcher(None, ocr, correct).ratio() > 0.6
            if len(ocr) <= 60 and len(correct) <= 60 and not correct.endswith(")") and close:
                md = md.replace(ocr, correct)
                applied.append(it)
            else:
                review.append({**it, "why": "not a small typo fix"})
        else:
            review.append({**it, "why": "unsupported or not found"})
    return md, applied, review


def unwrap(m: re.Match) -> str:
    inner = m.group(1)
    if "\\text{" not in inner:
        return m.group(0)
    s = inner.replace("\\times", "×")
    s = re.sub(r"\\(?:text|tag)\{([^{}]*)\}", r" \1", s)
    if re.search(r"[\\^_{}]", s):
        return m.group(0)
    return re.sub(r"\s+", " ", s).strip()


def table_to_text(m: re.Match) -> str:
    rows = []
    for tr in re.findall(r"<tr>(.*?)</tr>", m.group(0), flags=re.S):
        cells = [norm(re.sub(r"<[^>]+>", " ", c)) for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)]
        rows.append(" | ".join(c for c in cells if c))
    return "\n".join(r for r in rows if r)


def tidy_marks(ln: str) -> str:
    """Normalise short marks lines such as `$(2X10=20$ Marks)` to `(2X10=20 Marks)`."""
    if "Marks" not in ln or "=" not in ln or len(ln) > 45:
        return ln
    s = ln.replace("\\times", "×")
    s = re.sub(r"\$|\\text\{|\}|\\", "", s)
    return re.sub(r"\s+", " ", s).strip()


def cleanup(md: str) -> str:
    md = re.sub(r"<table>.*?</table>", table_to_text, md, flags=re.S)
    md = re.sub(r"!\[[^\]]*\]\(https?://[^)]*\)", "[figure]", md)
    md = re.sub(r"\$\$\s*(.+?)\s*\$\$", unwrap, md, flags=re.S)
    md = re.sub(r"(?<!\$)\$([^$\n]+)\$(?!\$)", unwrap, md)
    # A truncated "(C" or "(CO" followed by the full CO tag on its own line is OCR debris.
    md = re.sub(r"\(C(?:O)?\s*\n+\s*(\(CO\d\))", r"\1", md)
    out: list[str] = []
    prev = ""
    for ln in md.split("\n"):
        if "$" not in ln:
            ln = re.sub(r"\\text\{([^{}]*)\}", r"\1", ln)
        ln = tidy_marks(ln)
        # OXR sometimes repeats a whole paragraph; drop exact consecutive repeats.
        if len(ln) >= 30 and norm(ln) == prev:
            continue
        if ln.strip():
            prev = norm(ln)
        out.append(ln)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip() + "\n"


def process(pdf: Path, verify: bool) -> dict:
    global haiku_fails
    p = paths(pdf)
    p["final"].parent.mkdir(parents=True, exist_ok=True)
    t = time.time()
    if p["oxr"].exists():
        raw = p["oxr"].read_text(encoding="utf-8")
    else:
        raw = run_oxr(pdf)
        p["oxr"].write_text(raw, encoding="utf-8", newline="\n")
    log = {"pdf": str(pdf.relative_to(PYQS)), "verified": False, "applied": [], "review": []}
    md, cost = raw, 0.0
    doc = pdfium.PdfDocument(pdf)
    if verify and len(doc) > MAX_VERIFY_PAGES:
        log["note"] = f"{len(doc)} pages, Haiku check skipped"
    elif verify:
        if stop.is_set():
            raise RuntimeError("stopped after repeated Haiku failures")
        CACHE.mkdir(parents=True, exist_ok=True)
        tag = hashlib.sha1(str(pdf).encode()).hexdigest()[:10]
        images = []
        for i in range(len(doc)):
            img = CACHE / f"{tag}_p{i + 1}.png"
            doc[i].render(scale=200 / 72).to_pil().convert("RGB").save(img)
            images.append(str(img))
        try:
            issues, cost = run_haiku(images, p["oxr"])
            with lock:
                haiku_fails = 0
            md, log["applied"], log["review"] = apply_patches(raw, issues)
            log["verified"] = True
        except Exception as e:
            with lock:
                haiku_fails += 1
                if haiku_fails >= 3:
                    stop.set()
            raise RuntimeError(f"Haiku check failed: {e}") from e
        finally:
            for im in images:
                Path(im).unlink(missing_ok=True)
    p["final"].write_text(cleanup(md), encoding="utf-8", newline="\n")
    p["log"].write_text(json.dumps(log, indent=1, ensure_ascii=False), encoding="utf-8", newline="\n")
    return {
        "pdf": log["pdf"], "secs": time.time() - t, "cost": cost,
        "applied": len(log["applied"]), "review": len(log["review"]), "verified": log["verified"],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="process at most N pending PDFs")
    ap.add_argument("--only", default="", help="only PDFs whose relative path contains this text")
    ap.add_argument("--shuffle", type=int, default=None, help="shuffle with this seed before --limit")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--no-haiku", action="store_true", help="OXR only, skip the Haiku check")
    a = ap.parse_args()

    pdfs = [p for p in sorted(PYQS.rglob("*.pdf")) if a.only.lower() in p.relative_to(PYQS).as_posix().lower()]
    if a.shuffle is not None:
        random.Random(a.shuffle).shuffle(pdfs)
    pending = [p for p in pdfs if not paths(p)["final"].exists()]
    if a.limit:
        pending = pending[: a.limit]
    print(f"{len(pdfs)} PDFs matched, {len(pending)} to process", flush=True)

    done = fails = applied = review = 0
    cost = 0.0
    with ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(process, p, not a.no_haiku): p for p in pending}
        for f in as_completed(futs):
            try:
                r = f.result()
                done += 1
                applied += r["applied"]
                review += r["review"]
                cost += r["cost"]
                print(f"[{done + fails}/{len(pending)}] {r['pdf']}: {r['secs']:.0f}s applied={r['applied']} review={r['review']}", flush=True)
            except Exception as e:
                fails += 1
                print(f"[{done + fails}/{len(pending)}] FAILED {futs[f].relative_to(PYQS)}: {e}", flush=True)
    print(f"done={done} failed={fails} patches applied={applied} to review={review} list-price cost=${cost:.3f}")
    if stop.is_set():
        print("Stopped early after repeated Haiku failures (possibly your usage limit). Rerun later to resume.")


if __name__ == "__main__":
    main()
