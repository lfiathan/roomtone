"""Confirm the shipped index.html really was built from the current sources.

build_site.py inlines every asset, so a stale index.html is invisible without
checking its contents. This samples each source file in five places and fails
if any sample is missing from the built page.
"""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / 'repositories/music-learning/index.html').read_text()
assets = sorted((root / 'work/site-assets').iterdir())

stale = []
for asset in assets:
    body = asset.read_text()
    samples = [body[int(len(body) * (i + .5) / 5.5):][:80] for i in range(5)]
    if not all(sample in html for sample in samples):
        stale.append(asset.name)

if stale:
    print('index.html is stale for: ' + ', '.join(stale))
    print("Run 'make site' to rebuild it.")
    raise SystemExit(1)
print(f'index.html contains all {len(assets)} source assets')
