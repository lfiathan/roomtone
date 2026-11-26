from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
import textwrap
root = Path(__file__).resolve().parent.parent/'repositories/music-learning'
# macOS ships the originals; the Liberation/DejaVu families are the metric-compatible
# stand-ins used when the sheet is built inside the Linux container.
FONT_DIRS = [Path('/System/Library/Fonts/Supplemental'),
             Path('/usr/share/fonts/truetype/liberation'),
             Path('/usr/share/fonts/truetype/dejavu')]
FONT_CHOICES = {
    'Body':    ['Arial.ttf', 'LiberationSans-Regular.ttf', 'DejaVuSans.ttf'],
    'Bold':    ['Arial Bold.ttf', 'LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf'],
    'Display': ['Georgia.ttf', 'LiberationSerif-Regular.ttf', 'DejaVuSerif.ttf'],
    'Italic':  ['Georgia Italic.ttf', 'LiberationSerif-Italic.ttf', 'DejaVuSerif-Italic.ttf'],
}
def find_font(name, candidates):
    for filename in candidates:
        for directory in FONT_DIRS:
            path = directory / filename
            if path.exists():
                return path
    raise SystemExit(
        f"No font file found for {name!r}. Tried {candidates} under "
        + ', '.join(str(d) for d in FONT_DIRS)
        + ".\nOn Linux install the fonts-liberation package, or build with 'make docker-build'."
    )
for name, candidates in FONT_CHOICES.items():
    pdfmetrics.registerFont(TTFont(name, str(find_font(name, candidates))))
W,H=A4
# invariant=1 freezes the document ID and creation date so an unchanged
# source always renders a byte-identical PDF.
c=canvas.Canvas(str(root/'music-cheat-sheet.pdf'),pagesize=A4,pageCompression=1,invariant=1)
c.setTitle('Roomtone • Music cheat sheet')
c.setAuthor('Roomtone Music Workbook')
ink='#233d31'; teal='#456555'; muted='#526256'; line='#c2cdbb'; pale='#edf1e7'; orange='#f9c593'; blue='#e0ebec'
M=39
def color(v):return HexColor(v)
def rect(x,y,w,h,fill,r=0):
    c.setFillColor(color(fill))
    if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=0)
    else:c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(x,y,s,face='Body',size=10,fill=ink):
    c.setFillColor(color(fill));c.setFont(face,size);c.drawString(x,H-y,s)
def rule(x,y,x2,y2,fill=line,weight=.6):
    c.setStrokeColor(color(fill));c.setLineWidth(weight);c.line(x,H-y,x2,H-y2)
def para(x,y,s,w=510,size=10,leading=14,face='Body',fill=ink):
    for ln in simpleSplit(s,face,size,w):
        text(x,y,ln,face,size,fill);y+=leading
    return y
def label(x,y,s):text(x,y,s.upper(),'Bold',8.4,teal)
def title(x,y,s):text(x,y,s,'Display',20)
def page(n,section,t,desc):
    rect(0,0,W,H,'#fffef9')
    rect(M,29,21,21,ink,10)
    c.setLineWidth(.7);c.setStrokeColor(color('#e2c7a0'))
    for r in [7,4.5,1.7]:c.circle(M+10.5,H-39.5,r,fill=0,stroke=1)
    text(M+28,45,'Roomtone.','Bold',17)
    text(W-M-121,43,'MUSIC CHEAT SHEET  /  0'+str(n),'Bold',8,teal)
    rule(M,62,W-M,62);label(M,84,section);text(M,126,t,'Display',35);para(M,149,desc,W-2*M,10.5,14,fill=muted)
def foot(n,txt):
    rule(M,798,W-M,798);text(M,815,txt,'Body',8.3,muted);text(W-M-18,815,f'{n} / 3','Bold',8,teal);c.showPage()
def table(x,y,width,heads,rows,ratios,fontsize=9.5,rowpad=6):
    xs=[x]
    for frac in ratios:xs.append(xs[-1]+frac*width)
    rect(x,y,width,22,pale)
    for j,s in enumerate(heads):text(xs[j]+6,y+14,s.upper(),'Bold',8,teal)
    y+=22
    for row in rows:
        chunks=[simpleSplit(s,('Bold' if j==0 else 'Body'),fontsize,xs[j+1]-xs[j]-12) for j,s in enumerate(row)]
        rh=2*rowpad+max(len(z) for z in chunks)*(fontsize+2)
        for j,lines in enumerate(chunks):
            for i,s in enumerate(lines):text(xs[j]+6,y+rowpad+fontsize+i*(fontsize+2),s,'Bold' if j==0 else 'Body',fontsize)
        y+=rh;rule(x,y,x+width,y)
    return y
def box(x,y,w,h,heading,body,shade=pale):
    rect(x,y,w,h,shade,7);label(x+12,y+18,heading);para(x+12,y+37,body,w-24,9.8,13.5)
page(1,'Foundations','Time & pitch','Count with your foot, clap a rhythm, then find the same idea on a keyboard.')
title(M,190,'Count a bar of 4/4')
text(M,209,'At 96 BPM a quarter note lasts 0.625 seconds. Four quarter notes fill a 2.5-second bar.','Body',10)
x0=M+67;dx=(W-M-x0)/8
for j,s in enumerate(['1','&','2','&','3','&','4','&']):text(x0+j*dx+dx*.43,232,s,'Bold',10)
for r,(name,mask) in enumerate([('Kick',[1,0,0,0,1,0,0,0]),('Snare',[0,0,1,0,0,0,1,0]),('Hi-hat',[1]*8)]):
    y=240+r*22;text(M+2,y+12,name,'Bold',9)
    for j,val in enumerate(mask):rect(x0+j*dx+1,y,dx-4,16,[teal,'#be8055','#77969c'][r] if val else '#e9ede3',3)
text(M,318,'Filled cell = strike. Each column lasts one eighth note. Say “one and two and three and four and”.','Body',9,muted)
table(M,336,W-2*M,['Note value','Quarter-note beats','Count or use'],[
 ('Whole / half','4 / 2','Hold through four or two quarter-note beats.'),
 ('Quarter / eighth / sixteenth','1 / ½ / ¼','Four sixteenths in one beat: 1 e & a.'),
 ('Dotted note / tie','1½ × value / add lengths','A dotted half lasts 3 beats. A tie joins equal pitches.'),
 ('Rest','Silence for its value','Keep counting while the sound stops.')],[.31,.27,.42],9.2)
title(M,488,'Find the notes')
text(M,508,'C sits just left of a pair of black keys. Adjacent keys are a semitone apart.','Body',10)
x=M+3;y=526;kw=36;names=['C','D','E','F','G','A','B']*2
for j,s in enumerate(names):
    rect(x+j*kw,y,kw-1,52,'#f1eddd',2);text(x+j*kw+13,y+46,s,'Bold',9)
for j in [1,2,4,5,6,8,9,11,12,13]:rect(x+j*kw-10,y,20,31,ink,2)
box(M,599,(W-2*M-10)/2,93,'Major scale','W W H W W W H. In C, play C D E F G A B C. In G, use F-sharp. The tonic is the home note. W = two semitones, H = one.')
box(W/2+5,599,(W-2*M-10)/2,93,'Natural minor','W H W W H W W. Play A B C D E F G A. A minor and C major share notes. Their different tonics give phrases different homes.',blue)
title(M,725,'Measure an interval')
para(M,747,'Count semitones from the first pitch. Minor third = 3, major third = 4, perfect fourth = 5, perfect fifth = 7, octave = 12. From C, those pitches are E-flat, E, F, G and the next C.',W-2*M)
foot(1,'Practice room  /  Beat grid, Keys & harmony, Ear trainer')
page(2,'Composition','Chords to a song','Use one key and a four-bar loop to draft an idea you can play from memory.')
title(M,188,'Build the harmony')
table(M,204,W-2*M,['Chord shape','Semitones from root','Worked example'],[
 ('Major / minor','0, 4, 7 / 0, 3, 7','C–E–G / C–E-flat–G'),('Diminished / augmented','0, 3, 6 / 0, 4, 8','B–D–F / C–E–G-sharp'),('Dominant seventh','0, 4, 7, 10','G–B–D–F resolves naturally to C.')],[.33,.29,.38])
table(M,310,W-2*M,['Key','I','ii','iii','IV','V','vi','vii°'],[
 ('C major','C','Dm','Em','F','G','Am','Bdim'),('G major','G','Am','Bm','C','D','Em','F#dim')],[.19,.11,.11,.11,.10,.10,.11,.17])
para(M,406,'I–V–vi–IV = C–G–Am–F. Hold each chord for one bar. An inversion reorders the same notes: C–E–G becomes E–G–C. Try C–E–G → C–F–A for a smooth change.',W-2*M,10)
title(M,458,'Window Seat  /  16 bars')
text(M,478,'C major   •   4/4   •   96 BPM   •   approximately 40 seconds','Bold',9.8,teal)
table(M,492,W-2*M,['Bars','Section','Chords','What enters or leaves'],[
 ('1–4','Intro','C G Am F','Chords alone, one per bar.'),('5–8','Verse','C G Am F','Bass roots, light kick, snare and quarter-note hats.'),('9–12','Hook','C G Am F','Lead enters. Kick on 1 and 3, snare on 2 and 4.'),('13–16','Outro','C G F C','Chords alone. Let the last C ring.')],[.11,.15,.19,.55],9.2,4)
title(M,627,'Sing the four-bar hook')
text(M,647,'Numbers in parentheses are beat lengths. Middle C is C4. Each row totals four beats.','Body',9.5)
table(M,657,W-2*M,['Bar','Chord','Lead notes and beat lengths'],[
 ('9','C','E4 (1)   G4 (1)   A4 (1)   G4 (1)'),('10','G','G4 (1)   B4 (1)   D5 (2)'),('11','Am','C5 (1)   E5 (1)   A4 (2)'),('12','F','A4 (1)   G4 (1)   F4 (2)')],[.13,.18,.69],9,3)
text(M,770,'Make it yours: sing one new ending, leave a breath, then repeat the phrase.','Italic',10)
foot(2,'Song project  /  Window Seat score and downloadable MIDI')
page(3,'Recording & production','GarageBand at hand','Follow one column from an empty session to a stereo export. Keep the editable project.')
table(M,176,W-2*M,['Task','Mac','iPhone / iPad'],[
 ('Start','File → New → Empty Project. Create a Software Instrument track and select a piano.','My Songs → add a song → Tracks → Keyboard. Use Song Settings for tempo, meter and key.'),
 ('Set the form','Set 96 BPM, 4/4 and C major. Enable metronome and count-in. Arrange regions across bars 1–16.','Open Song Sections at the ruler’s right edge. Set Section A to 16 bars or use four sections of four.'),
 ('Record','Window → Show Musical Typing (Command-K). R records and Space stops. Add an Audio track for a microphone.','Tap Record and play a Touch Instrument. Add Audio Recorder for a voice or acoustic instrument.'),
 ('Edit','Double-click the software-instrument region for Piano Roll. Drag notes to correct timing or pitch.','In Tracks view, tap a green region, tap it again, then Edit. Drag a note or its edge.'),
 ('Mix','Use track levels and pan. Open Smart Controls for EQ and effects. Play the loudest section.','Use Track Controls for volume, pan and Plug-ins & EQ. Audition All Sections for songs spanning sections.'),
 ('Export','Save the editable session. Share → Export Song to Disk. Select the full range and choose a format.','Return to My Songs. Hold the song → Share → Song → quality → Share → Save to Files.')],[.14,.43,.43],9.25,7)
box(M,465,W-2*M,57,'If you only hear the loop','On Mac, check the cycle or selection range in the export dialog. On iPhone or iPad, check Song Sections and play All Sections before sharing.',blue)
title(M,553,'Three listening passes')
for i,(name,desc) in enumerate([
 ('Balance','Start with the hook. Lower parts that cover it. Check the bass and kick together.'),
 ('Space','Use pan for placement, EQ for tone and reverb for depth. Compare at similar loudness.'),
 ('Export','Open the audio outside GarageBand. Check the first beat, hook entrance and final decay.')]):
    y=577+i*37;rect(M,y-11,21,20,pale,4);text(M+7,y+3,str(i+1),'Bold',9,teal);text(M+32,y,name,'Bold',10);para(M+101,y,desc,W-2*M-103,9.3,12)
box(M,691,W-2*M,60,'Two files to keep','Save the project to keep editing the tracks. Export WAV or AIFF for an uncompressed listening copy, or use a compressed format for a smaller file.')
text(M,776,'Reference: Apple GarageBand User Guides for Mac, iPhone and iPad. Open the linked guides in the site.','Body',8.4,muted)
c.linkURL('https://support.apple.com/garageband',(M,H-781,W-M,H-762),relative=0,thickness=0)
foot(3,'GarageBand field guide  /  Device-specific steps and troubleshooting')
c.save()
print('built', root.name + '/music-cheat-sheet.pdf - 3 pages')
