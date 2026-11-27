# Roomtone — build

Source for the Roomtone music-learning studio. The deliverable is a single
self-contained `index.html`: every stylesheet, script, the cheat-sheet PDF and
the example MIDI are inlined into it, so the finished page needs no server, no
network and no dependencies.

```
work/site-assets/*.js, *.css  ─┐
work/site-template.html        ├─►  repositories/music-learning/index.html
music-cheat-sheet.pdf (base64) │
window-seat.mid       (base64) ─┘
```

## Layout

| Path | What it holds |
|---|---|
| `work/site-assets/` | The real source: 22 CSS and JS modules |
| `work/site-template.html` | Page shell the assets are inlined into |
| `work/*.py`, `work/*.js` | Build scripts (see targets below) |
| `work/qa/` | WebKit screenshot and assertion harnesses |
| `repositories/music-learning/` | The built site and its downloads |
| `outputs/` | Delivery mirror and zip |

Edit files in `work/site-assets/`, never `repositories/music-learning/index.html` —
that file is generated and any hand edit is overwritten by the next build.

## Build on this machine

Needs Python 3, Node, and `reportlab` for the PDF:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Then run the pipeline, pointing `make` at that interpreter:

```bash
PYTHON=.venv/bin/python make all
```

`make help` lists every target. The useful ones:

| Target | Does |
|---|---|
| `make all` | `pdf` + `midi` + `beats` + `site` + `package` |
| `make site` | Inline the assets into `index.html` |
| `make pdf` | Render the three-page A4 cheat sheet |
| `make midi` | Export the 16-bar example song |
| `make beats` | Export the 37 genre beat templates |
| `make package` | Mirror into `outputs/` and rebuild the zip |
| `make verify` | Confirm `index.html` is not stale |
| `make check` | Confirm the beat MIDI still matches what is committed |
| `make qa` | Run all six headless interaction suites (macOS) |
| `make serve` | Preview at `http://localhost:8080` |

## Build with Docker

Avoids installing anything. The image carries Python, `reportlab`, Node and
metric-compatible fonts:

```bash
make docker-build
```

Serve the built site at `http://localhost:8080`:

```bash
make docker-serve
```

Both honour `PORT`, e.g. `PORT=3000 make docker-serve`.

The container substitutes Liberation and DejaVu for Arial and Georgia, which
macOS supplies. The PDF's text and layout are identical either way, but the
glyphs differ, so a PDF built in the container is not byte-identical to one
built on macOS. Build the PDF on macOS when the exact original typography
matters; everything else is identical on both.

## Reproducibility

An unchanged source tree rebuilds byte-for-byte on the same platform — the PDF
is rendered with `invariant=1` and the zip with a fixed timestamp. Two useful
consequences:

- `make check` regenerates all 37 beat MIDI files in memory and fails if any
  differs from the copy on disk, so a change to `templates.js` that silently
  alters an exported groove is caught.
- `make verify` samples each source asset in five places and fails if any is
  missing from `index.html`, which is the only way to notice a stale build
  given everything is inlined.

## Tests

`make qa` compiles two small Objective-C/WebKit harnesses and runs six suites
against the built page — 1,310 assertions in total:

- `work/qa/check-upgrade.js` — 421 assertions over the keyboard mapping, beat
  grid, templates, routing and WAV capture.
- `work/qa/check-freestyle.js` — 49 assertions over the deck parts, density,
  transpose, scene recall and persistence.
- `work/qa/check-piano.js` — 57 assertions over the piano keybed, the typing
  window, the sustain pedal, touch and MIDI input.
- `work/qa/check-lessons.js` — 571 assertions over the chapter split, the fixed
  lesson shape, the figures, vocabulary order and the quiz.
- `work/qa/check-widgets.js` — 71 assertions that drive all nine widget kinds:
  pressing keys, toggling cells, dragging faders, starting and stopping the
  transport.
- `work/qa/check-narrow.js` — 141 assertions that every route fits a 390px
  viewport and that the widget grids scroll rather than squeeze, run at that
  width.

All six stub `AudioContext` with `OfflineAudioContext`, so the audio graph is
exercised without an output device.

Two checks in `check-lessons.js` are worth knowing about, because they enforce
editorial rules rather than code behaviour. The course marks a term in `<b>`
at the point it is defined, so the suite reads those tags back out and fails if
a term is used in a quiz before the lesson that defines it, or if any term is
introduced as new twice. Neither rule needs a list to maintain: both are derived
from the prose itself.

## Where the code lives

Nineteen scripts, inlined in the order below — 3352 lines of JavaScript, plus three
stylesheets. They are classic scripts sharing one global scope, so a call from
one file into another resolves at render time whatever the order. What the order
does decide is the handful of lines that run *as a file loads*:

| `figures.js` | 245 | Five SVG primitives the lessons are drawn with |
| `widgets.js` | 169 | Widget plumbing: per-instance state, transport, keybed, the `W_KINDS` registry |
| `widgets-theory.js` | 214 | The chapter 1 widgets: keys, tempo, chords, contour |
| `widgets-studio.js` | 244 | The chapter 2 and 3 widgets: steps, arrange, mix, compare, tap |
| `course-theory.js` | 529 | Chapter 1, as data |
| `course-writing.js` | 248 | Chapter 2, as data |
| `course-studio.js` | 220 | Chapter 3, as data |
| `lessons.js` | 43 | Assembles the three chapters and derives each lesson's figures |
| `handbook.js` | 44 | The GarageBand guide |
| `sound.js` | 106 | `StudioAudio`: the context, the transport and the step sequencer |
| `instruments.js` | 133 | `MusicEngine`: voices, drum kit, mixer, recording |
| `templates.js` | 92 | The 37 genre beats and the chord book |
| `studio.js` | 175 | Shell, router, lesson rendering, and the helpers everything shares |
| `keybed.js` | 100 | The typing keyboard: which key sounds which note, what is held, the pedal |
| `groove.js` | 115 | The practice room: one editable pattern, its genre library and its export |
| `deck.js` | 255 | Freestyle: four layers over a chord loop, scenes, recording |
| `rhythm.js` | 154 | The drums & bass step editor behind the deck |
| `piano.js` | 108 | The piano room: wide keybed, touch, sustain, MIDI in |
| `wiring.js` | 158 | The switchboard: six delegated listeners, then the first `render()` |

There are exactly three ordering constraints:

- `widgets.js` creates the `W_KINDS` registry that the two widget files assign
  themselves into.
- `deck.js` reads `groove.js`'s `presetId` at load time, because the deck's own
  template selection falls back to the practice room's.
- `wiring.js` calls `render()`, so it loads once every file above it has
  initialised its state.

`wiring.js` keeps all six listeners together deliberately. They are delegated
and keyed on `data-*` attributes, so one `click` handler serves every room at
once; splitting them per feature would duplicate the shared guards and change
the order in which a single keystroke is offered around.

## Course structure

The course is three chapters, one source file each, assembled in `lessons.js`:

| File | Chapter | Lessons |
|---|---|---|
| `course-theory.js` | Music theory | 11, in modules Time / Pitch / Harmony / Melody |
| `course-writing.js` | Writing a song | 4, in Groove / Words / Form |
| `course-studio.js` | The studio | 4, in Recording / Editing / Mixing / Finishing |

Theory is deliberately complete and comes first: nothing in chapters 2 and 3
introduces a musical term chapter 1 has not already defined, which is what the
vocabulary checks above enforce.

A lesson is a list of `blocks`, and a block is one idea — a heading, a paragraph
or two, then a figure of what was just described or a widget that does it:

```js
blocks:[
 {h:'Beats come in groups',
  p:['...','...'],
  fig:{kind:'grid', ...},
  widget:{kind:'steps', ...}}
]
```

`lesson()` in `studio.js` numbers them, so the progression through a lesson is
visible on the page rather than implied.

## Lesson widgets

`work/site-assets/widgets.js` holds nine interactive primitives, named as data
in the same way the figures are:

| `kind` | What you do with it |
|---|---|
| `keys` | A keybed in one of four modes: name a note, measure an interval, light a scale, build a chord with inversions |
| `steps` | An editable drum grid with a tempo slider |
| `tempo` | A click with the BPM arithmetic updating live, and a metre selector |
| `chords` | Four chord slots with roman numerals and a looping playback |
| `contour` | A melody you draw on the scale degrees |
| `arrange` | Layers against sections, playing all sixteen bars |
| `mix` | Faders and panners over a looping bed |
| `compare` | Two to four versions of the same thing, A/B |
| `tap` | Tap along with a click; reports your timing error in milliseconds |

Each widget owns its state in `W_STATE`, keyed by an id handed out at render
time. `render()` calls `resetWidgets()` before building a page, so ids restart
from one and nothing leaks between routes. Audio goes through `MusicEngine` and
`StudioAudio`; `MusicEngine.play` and `.hit` accept a destination node, which is
how the mixer widget gets its own gain and panner per track.

## Lesson figures

`work/site-assets/figures.js` holds five SVG primitives — `keys`, `grid`,
`timeline`, `contour` and `meters` — and each block names one as data rather
than drawing its own markup:

```js
fig:{kind:'grid', beats:4, div:2,
     lanes:[{name:'Snare', tone:'orange', on:[2,6]}],
     alt:'...', caption:'...'}
```

`drawFigure` dispatches on `kind`. Every figure carries an `alt` for screen
readers and a `caption` shown under it, and `check-lessons.js` fails if either
is missing or if a figure stops marking the notes or hits its caption claims.

The lesson cards reuse the same drawings. `figureThumb` re-renders a figure with
the labels dropped and the name gutter closed up, because a card tile is about
400x128 and the figure's own type would land at seven pixels. The shapes still
tell the nineteen lessons apart; the card heading carries the words. A card
takes the first figure of its lesson, derived once in `lessons.js`, so there is
no second set of artwork to keep in step and no way for a card to illustrate a
lesson with a picture that lesson does not contain.
