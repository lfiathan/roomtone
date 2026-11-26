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
| `work/site-assets/` | The real source: 10 CSS and JS modules |
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
| `make qa` | Run all five headless interaction suites (macOS) |
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

`make qa` compiles two small Objective-C/WebKit harnesses and runs five suites
against the built page:

- `work/qa/check-upgrade.js` — 421 assertions over the keyboard mapping, beat
  grid, templates, routing and WAV capture.
- `work/qa/check-freestyle.js` — 44 assertions over the deck parts, density,
  transpose, scene recall and persistence.
- `work/qa/check-piano.js` — 57 assertions over the piano keybed, the typing
  window, the sustain pedal, touch and MIDI input.
- `work/qa/check-lessons.js` — 228 assertions over the lesson figures, the fixed
  page shape, vocabulary order and the quiz.
- `work/qa/check-narrow.js` — 49 assertions that every route fits a 390px
  viewport, run at that width.

All five stub `AudioContext` with `OfflineAudioContext`, so the audio graph is
exercised without an output device.

## Lesson figures

`work/site-assets/figures.js` holds five SVG primitives — `keys`, `grid`,
`timeline`, `contour` and `meters` — and each lesson names one as data rather
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
400x112 and the figure's own type would land at seven pixels. The shapes still
tell the twelve lessons apart; the card heading carries the words. There is no
second set of artwork to keep in step — edit a lesson's figure and its card
follows.
