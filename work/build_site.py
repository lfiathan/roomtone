from pathlib import Path
from base64 import b64encode
import re
root=Path(__file__).resolve().parent.parent
project=root/'repositories/music-learning'
source=root/'work/site-template.html'
if not source.exists():
    source.write_text((project/'index.html').read_text())
markup=source.read_text()
assets=root/'work/site-assets'
# widgets.css comes last so its single-class rules win over the same-specificity
# base rules it deliberately overrides (.w-keys against .lab-keys, say).
css='\n'.join((assets/name).read_text() for name in ('studio.css','rooms.css','widgets.css'))
markup=markup.replace('<link rel="stylesheet" href="assets/studio.css">','<style>\n'+css+'\n</style>')
def inline(match):
    body=(assets/Path(match.group(1)).name).read_text()
    for name,mime in [('music-cheat-sheet.pdf','application/pdf'),('window-seat.mid','audio/midi')]:
        body=body.replace('href="'+name+'" download', 'href="data:'+mime+';base64,'+b64encode((project/name).read_bytes()).decode()+'" download="'+name+'"')
    return '<script>\n'+body+'\n</script>'
markup=re.sub(r'<script src="([^"]+)"></script>',inline,markup)
(project/'index.html').write_text(markup)
print('built',project.joinpath('index.html').relative_to(root),'-',len(markup),'bytes')
