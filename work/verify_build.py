"""Confirm the shipped index.html really was built from the current sources.

build_site.py inlines every asset, so a stale index.html is invisible without
checking its contents. This samples each source file in five places and fails
if any sample is missing from the built page.

The build also rewrites the two download links into base64 data URIs while it
inlines, so the same rewrite is applied here before sampling — otherwise a
sample landing on one of those links would look stale when it is not.
"""
from base64 import b64encode
from pathlib import Path

root = Path(__file__).resolve().parent.parent
project = root / 'repositories/music-learning'
html = (project / 'index.html').read_text()
assets = sorted((root / 'work/site-assets').iterdir())

DOWNLOADS = [('music-cheat-sheet.pdf', 'application/pdf'), ('window-seat.mid', 'audio/midi')]


def as_inlined(body):
    """Apply the same substitution build_site.py makes."""
    for name, mime in DOWNLOADS:
        payload = b64encode((project / name).read_bytes()).decode()
        body = body.replace(f'href="{name}" download',
                            f'href="data:{mime};base64,{payload}" download="{name}"')
    return body


stale = []
for asset in assets:
    body = as_inlined(asset.read_text())
    samples = [body[int(len(body) * (i + .5) / 5.5):][:80] for i in range(5)]
    if not all(sample in html for sample in samples):
        stale.append(asset.name)

if stale:
    print('index.html is stale for: ' + ', '.join(stale))
    print("Run 'make site' to rebuild it.")
    raise SystemExit(1)
print(f'index.html contains all {len(assets)} source assets')
