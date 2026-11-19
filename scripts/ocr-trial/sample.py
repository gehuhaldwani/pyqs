# /// script
# requires-python = ">=3.11"
# dependencies = ["pypdfium2", "pillow"]
# ///
"""Pick varied sample pages from pyqs/ and render them to PNG."""
import random
import sys
from pathlib import Path

import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2] / "pyqs"
OUT = Path(__file__).parent / "out" / "samples"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 24
DPI = 200

random.seed(7)
pdfs = sorted(ROOT.rglob("*.pdf"))
# Spread across top-level folders so programs with different scan quality are covered.
by_dir: dict[str, list[Path]] = {}
for p in pdfs:
    by_dir.setdefault(p.relative_to(ROOT).parts[0], []).append(p)
picked: list[Path] = []
dirs = sorted(by_dir)
while len(picked) < N:
    for d in dirs:
        if len(picked) < N:
            picked.append(random.choice(by_dir[d]))
OUT.mkdir(parents=True, exist_ok=True)
manifest: dict[str, str] = {}
for i, p in enumerate(picked):
    doc = pdfium.PdfDocument(p)
    page = doc[0]
    img = page.render(scale=DPI / 72).to_pil().convert("RGB")
    name = f"{i:02d}_{p.relative_to(ROOT).parts[0].replace(' ', '-')}_{p.stem[:30].replace(' ', '-')}.png"
    img.save(OUT / name)
    manifest[name] = str(p)
    print(name, img.size, len(doc), "pages")
import json; (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
