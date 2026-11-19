# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""Send the sampled source PDFs to the OXR free API and save markdown per PDF."""
import json
import time
from pathlib import Path

import httpx

HERE = Path(__file__).parent
manifest = json.loads((HERE / "out" / "samples" / "manifest.json").read_text())
OUT = HERE / "out" / "oxr"
OUT.mkdir(parents=True, exist_ok=True)
URL = "https://free-oxr.somark.ai/api/v1/parse/sync"

with httpx.Client(timeout=300) as client:
    for name, pdf in manifest.items():
        dest = OUT / (Path(name).stem + ".md")
        if dest.exists():
            continue
        t = time.time()
        with open(pdf, "rb") as f:
            r = client.post(
                URL,
                files={"file": (Path(pdf).name, f, "application/pdf")},
                data={"api_key": "dummy", "output_formats": "markdown"},
            )
        try:
            body = r.json()
        except ValueError:
            print(name, "NON-JSON", r.status_code, r.text[:200], flush=True)
            time.sleep(20)
            continue
        if r.status_code != 200 or body.get("code") != 0:
            print(name, "FAILED", r.status_code, str(body)[:200], flush=True)
            continue
        dest.write_text(body["data"]["result"]["outputs"]["markdown"], encoding="utf-8")
        print(f"{name}: {time.time() - t:.1f}s, api {body['data']['metadata']['processing_time_ms']}ms", flush=True)
