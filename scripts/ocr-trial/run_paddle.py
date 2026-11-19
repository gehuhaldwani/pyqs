# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["paddlepaddle==3.2.1", "paddleocr[doc-parser]>=3.6.0"]
# ///
"""Run PaddleOCR-VL-1.6 on the sample PNGs, writing markdown per page and timings."""
import sys
import time
from pathlib import Path

from paddleocr import PaddleOCRVL

HERE = Path(__file__).parent
SRC = HERE / "out" / "samples"
OUT = HERE / "out" / "paddle"
OUT.mkdir(parents=True, exist_ok=True)
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 999

pipe = PaddleOCRVL(pipeline_version="v1.6")
for png in sorted(SRC.glob("*.png"))[:limit]:
    if (OUT / png.stem / f"{png.stem}.md").exists():
        continue
    t = time.time()
    res = list(pipe.predict(str(png)))
    for r in res:
        r.save_to_markdown(save_path=str(OUT / png.stem))
    print(f"{png.name}: {time.time() - t:.1f}s", flush=True)
