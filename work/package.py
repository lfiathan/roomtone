"""Mirror the finished site into outputs/ and build the delivery zip.

The zip is written with a fixed timestamp so repeated builds of unchanged
sources produce an identical archive.
"""
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
project = root / 'repositories/music-learning'
outputs = root / 'outputs'
mirror = outputs / 'music-learning'
archive = outputs / 'music-learning.zip'

outputs.mkdir(exist_ok=True)
if mirror.exists():
    shutil.rmtree(mirror)
shutil.copytree(project, mirror)

files = sorted(p for p in mirror.rglob('*') if p.is_file())
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in files:
        info = zipfile.ZipInfo(str(path.relative_to(outputs)), date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, path.read_bytes())

print(f'packaged {len(files)} files -> outputs/music-learning/ and {archive.name}')
