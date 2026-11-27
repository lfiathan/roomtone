// Regenerates repositories/music-learning/genre-beats/ from the shipped template
// library. templates.js is the single source of truth: it defines the kit, the
// meters, patternFrom() and makeBeatMidi(), and the site exports the same bytes
// from exportBeat(true) in groove.js.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'work', 'site-assets');
const outDir = path.join(root, 'repositories', 'music-learning', 'genre-beats');

const ctx = vm.createContext({ TextEncoder });
vm.runInContext(fs.readFileSync(path.join(assets, 'templates.js'), 'utf8'), ctx);
const { beatsLibrary, patternFrom, makeBeatMidi, meters } =
  vm.runInContext('({beatsLibrary,patternFrom,makeBeatMidi,meters})', ctx);

// Same slug rule as exportBeat() in groove.js.
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

const check = process.argv.includes('--check');
let written = 0, matched = 0, differed = [];

for (const t of beatsLibrary) {
  const m = meters[t.meter];
  const steps = m.beats * m.div * (t.next ? 2 : 1);
  const bytes = Buffer.from(makeBeatMidi(patternFrom(t), t.meter, t.bpm, t.swing, steps, 1, t.name));
  const file = path.join(outDir, slug(t.family), `${slug(t.name)}-${t.bpm}bpm.mid`);

  const existing = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (existing && existing.equals(bytes)) matched++;
  else if (existing) differed.push(path.relative(root, file));

  if (!check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    written++;
  }
}

const label = check ? 'checked' : 'wrote';
console.log(`${label} ${check ? beatsLibrary.length : written} beat MIDI files; ${matched} byte-identical to the copy on disk`);
if (differed.length) {
  console.error('differs from disk:\n  ' + differed.join('\n  '));
  if (check) process.exit(1);
}
