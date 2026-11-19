# /// script
# requires-python = ">=3.11"
# dependencies = ["pypdfium2", "pillow"]
# ///
"""Ask Haiku (via `claude -p`, on the subscription) to check OXR markdown against the source PDF.

Writes one JSON patch list per sample to out/haiku/. Does not edit the markdown.
"""
import json
import pypdfium2 as pdfium
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[1]
manifest = json.loads((HERE / "out" / "samples" / "manifest.json").read_text())
OUT = HERE / "out" / "haiku"
OUT.mkdir(parents=True, exist_ok=True)
only = sys.argv[1:]  # optional name prefixes

PROMPT = """Check an OCR transcription against the source PDF.
Page images: {images}
OCR markdown: {md}
Read the markdown and every page image with the Read tool.
Find only real errors: text on the page that is missing from the markdown, wrong words or numbers,
wrong math, or lines in the wrong order. Ignore headers, logos, formatting and whitespace.
Reply with JSON only, no prose, in this shape:
{{"issues":[{{"kind":"missing|wrong|order","page":1,"after":"short exact quote of the markdown line this goes after","ocr":"text now in markdown or empty","correct":"what the page actually says"}}]}}
Use {{"issues":[]}} if the transcription is faithful."""

for name, pdf in manifest.items():
    stem = Path(name).stem
    if only and not any(stem.startswith(p) for p in only):
        continue
    dest = OUT / f"{stem}.json"
    if dest.exists():
        continue
    md = HERE / "out" / "oxr" / f"{stem}.md"
    PG = HERE / "out" / "pages"
    PG.mkdir(exist_ok=True)
    doc = pdfium.PdfDocument(pdf)
    imgs = []
    for i in range(len(doc)):
        p = PG / f"{stem}_p{i + 1}.png"
        if not p.exists():
            doc[i].render(scale=200 / 72).to_pil().convert("RGB").save(p)
        imgs.append(str(p))
    t = time.time()
    r = subprocess.run(
        ["claude", "-p", "--model", "haiku", "--output-format", "json",
         "--tools", "Read", "--allowedTools", "Read",
         "--system-prompt", "You verify OCR output against a source document.",
         "--setting-sources", "", "--strict-mcp-config", "--disable-slash-commands",
         "--no-session-persistence"],
        input=PROMPT.format(images=", ".join(imgs), md=md),
        capture_output=True, text=True, encoding="utf-8", cwd=REPO,
    )
    try:
        d = json.loads(r.stdout)
    except ValueError:
        print(stem, "FAILED", r.stderr[:200], r.stdout[:200], flush=True)
        continue
    dest.write_text(json.dumps(d, indent=1), encoding="utf-8")
    u = d.get("usage", {})
    print(f"{stem}: {time.time() - t:.0f}s in={u.get('input_tokens')}+{u.get('cache_creation_input_tokens')}+{u.get('cache_read_input_tokens')} out={u.get('output_tokens')} ${d.get('total_cost_usd', 0):.4f}", flush=True)
