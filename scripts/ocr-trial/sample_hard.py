# /// script
# requires-python = ">=3.11"
# dependencies = ["pypdfium2", "pillow"]
# ///
"""Select 20 tough GEHU PYQ pages (math, physics, chemistry, tables, noisy scans).

Renders selected pages at 200 DPI to out/samples_hard/ with manifest.json,
and bundles out/samples/ + out/samples_hard/ into gehu_ocr_samples.zip.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import zipfile
from pathlib import Path

import pypdfium2 as pdfium
from PIL import ImageStat

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1] / "pyqs"
OUT_HARD = HERE / "out" / "samples_hard"
OUT_SAMPLES = HERE / "out" / "samples"
ZIP_PATH = HERE / "gehu_ocr_samples.zip"
DPI = 200
TARGET_COUNT = 20

MATH_CUES = re.compile(
    r"integral|matrix|matrices|eigen|differential|laplace|fourier|theorem|dy/dx|solve|evaluate|prove",
    re.I,
)
TABLE_CUES = re.compile(
    r"balance sheet|table|frequency|mean|median|variance|anova|simplex|trial balance|marks|sql|schema|distribution",
    re.I,
)


def rel_posix(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def page_text(doc: pdfium.PdfDocument, idx: int) -> str:
    try:
        return doc[idx].get_textpage().get_text_range().strip()
    except Exception:
        return ""


def image_noise_score(doc: pdfium.PdfDocument, idx: int) -> float:
    """Estimate scan darkness/noise at low DPI (higher = darker/noisier background)."""
    img = doc[idx].render(scale=72 / 72).to_pil().convert("L")
    stat = ImageStat.Stat(img)
    # Clean digital PDFs have mean ~245-254; hand scans have lower mean / higher stddev.
    mean_darkness = max(0.0, 250.0 - stat.mean[0])
    return mean_darkness + 0.5 * stat.stddev[0]


def choose_page_index(
    doc: pdfium.PdfDocument,
    prefer_interior: bool,
    cue_re: re.Pattern[str] | None = None,
) -> int:
    n = len(doc)
    if n <= 1:
        return 0
    indices = list(range(1, n)) + [0] if prefer_interior else list(range(n))
    if cue_re is None:
        return indices[0]

    best_idx = indices[0]
    best_score = -1
    for i in indices:
        txt = page_text(doc, i)
        score = len(cue_re.findall(txt)) * 10 + min(len(txt), 2000) // 200
        if prefer_interior and i > 0:
            score += 5
        if score > best_score:
            best_score = score
            best_idx = i
    return best_idx


def pick_from_candidates(
    candidates: list[Path],
    category: str,
    quota: int,
    used_pdfs: set[Path],
    cue_re: re.Pattern[str] | None = None,
    prefer_noisy: bool = False,
) -> list[tuple[Path, int, str]]:
    picked: list[tuple[Path, int, str]] = []
    # Prefer endsem / multi-page papers first while keeping deterministic variety.
    ordered = sorted(
        candidates,
        key=lambda p: (
            0 if "endsem" in p.name.lower() else 1,
            0 if "btech" in rel_posix(p).lower() else 1,
            rel_posix(p),
        ),
    )

    # Spread picks across sorted candidates to cover different semesters/years.
    rng = random.Random(f"gehu-hard-{category}")
    pool = [p for p in ordered if p not in used_pdfs]
    if len(pool) > quota * 3:
        # Take a deterministic stratified subset across the sorted list + shuffle within.
        step = max(1, len(pool) // (quota * 3))
        sampled_pool = pool[::step]
        rng.shuffle(sampled_pool)
        pool = sampled_pool + [p for p in pool if p not in sampled_pool]

    for idx_pick, pdf_path in enumerate(pool):
        if len(picked) >= quota:
            break
        try:
            doc = pdfium.PdfDocument(pdf_path)
        except Exception:
            continue
        if len(doc) == 0:
            continue

        prefer_interior = (len(doc) > 1) and (idx_pick % 2 == 1 or len(picked) >= 1)
        if prefer_noisy:
            # Skip digital PDFs with full embedded text layer unless no pure scans left.
            p_idx = choose_page_index(doc, prefer_interior=prefer_interior)
            txt = page_text(doc, p_idx)
            bytes_per_page = pdf_path.stat().st_size / max(1, len(doc))
            noise = image_noise_score(doc, p_idx)
            if len(txt) > 60 and bytes_per_page > 250_000 and noise < 20:
                continue
        else:
            p_idx = choose_page_index(doc, prefer_interior=prefer_interior, cue_re=cue_re)

        used_pdfs.add(pdf_path)
        picked.append((pdf_path, p_idx, category))
    return picked


def select_hard_samples(target: int = TARGET_COUNT) -> list[tuple[Path, int, str]]:
    pdfs = sorted(ROOT.rglob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDFs found under {ROOT}")

    def match_any(keywords: tuple[str, ...]) -> list[Path]:
        return [p for p in pdfs if any(k in rel_posix(p).lower() for k in keywords)]

    math_pdfs = match_any(
        ("engineering mathematics", "advance engineering mathematics", "discrete mathematics", "basic mathematics", "numerical")
    )
    physics_pdfs = match_any(("engineering physics", "physics"))
    chemistry_pdfs = match_any(("engineering chemistry", "chemistry", "biochemistry"))
    table_pdfs = match_any(
        ("accounting", "biostatistics", "statistics", "operations research", "database", "dbms", "income tax", "finance")
    )
    noisy_pdfs = [
        p
        for p in pdfs
        if any(tag in rel_posix(p).lower() for tag in ("/old/", "2016", "2017", "2018", "2019", "2020", "2021"))
    ]

    # Allocate 4 pages per category for 20 pages total (scaled proportionally if target != 20).
    base_quotas = [
        ("math", math_pdfs, MATH_CUES, False),
        ("physics", physics_pdfs, None, False),
        ("chemistry", chemistry_pdfs, None, False),
        ("tables", table_pdfs, TABLE_CUES, False),
        ("noisy_scan", noisy_pdfs, None, True),
    ]
    per_cat = max(1, target // len(base_quotas))
    remainder = max(0, target - per_cat * len(base_quotas))

    used: set[Path] = set()
    selected: list[tuple[Path, int, str]] = []
    for idx, (cat, cand, cue, noisy) in enumerate(base_quotas):
        q = per_cat + (1 if idx < remainder else 0)
        selected.extend(
            pick_from_candidates(cand, cat, q, used, cue_re=cue, prefer_noisy=noisy)
        )

    # Top up from general pool if any category had fewer PDFs than quota.
    if len(selected) < target:
        selected.extend(
            pick_from_candidates(
                pdfs, "noisy_scan", target - len(selected), used, prefer_noisy=True
            )
        )
    return selected[:target]


def render_samples(picks: list[tuple[Path, int, str]], out_dir: Path) -> dict[str, dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for old_png in out_dir.glob("*.png"):
        old_png.unlink()

    manifest: dict[str, dict] = {}
    for i, (pdf_path, page_idx, category) in enumerate(picks):
        doc = pdfium.PdfDocument(pdf_path)
        img = doc[page_idx].render(scale=DPI / 72).to_pil().convert("RGB")
        prog = pdf_path.relative_to(ROOT).parts[0].replace(" ", "-")
        stem = pdf_path.stem[:28].replace(" ", "-")
        name = f"{i:02d}_{category}_{prog}_{stem}_p{page_idx + 1}.png"
        img.save(out_dir / name)
        manifest[name] = {
            "pdf": rel_posix(pdf_path),
            "page": page_idx,
            "category": category,
        }
        print(
            f"{name} {img.size} (page {page_idx + 1}/{len(doc)}, {category})",
            flush=True,
        )

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return manifest


def bundle_zip(zip_path: Path) -> None:
    dirs = [("samples", OUT_SAMPLES), ("samples_hard", OUT_HARD)]
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        count = 0
        for prefix, folder in dirs:
            if not folder.exists():
                print(f"Warning: {folder} does not exist yet; skipping from zip", flush=True)
                continue
            for f in sorted(folder.rglob("*")):
                if f.is_file():
                    zf.write(f, arcname=f"{prefix}/{f.relative_to(folder).as_posix()}")
                    count += 1
    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"Bundled {count} files into {zip_path} ({size_mb:.2f} MB)", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="Build 20 hard math/table/noisy-scan samples.")
    ap.add_argument("--count", type=int, default=TARGET_COUNT)
    ap.add_argument("--no-bundle", action="store_true", help="Skip creating gehu_ocr_samples.zip")
    args = ap.parse_args()

    picks = select_hard_samples(args.count)
    render_samples(picks, OUT_HARD)
    if not args.no_bundle:
        bundle_zip(ZIP_PATH)


if __name__ == "__main__":
    main()
