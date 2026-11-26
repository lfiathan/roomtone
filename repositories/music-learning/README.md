# Roomtone music-learning studio

Open **index.html** in Safari, Chrome, Firefox, or Edge. The lessons, instruments, song example, and downloads work offline. Click a key or play button to start audio.

## A first session

1. Select **Hear the song** on the overview. Listen for the drums entering and the hook arriving.
2. Open **Lessons** and start **Chapter 01 · Music theory**. Lesson 1 is **Pulse, beat and bar**: tap along with the click, then build a backbeat in the grid on the same page.
3. Work down the page, answer the check at the bottom, then return once from memory. Take the chapters in order.
4. Open **Song project** and **GarageBand** together when you are ready to record. Choose Mac or iPhone & iPad in the guide.

## The three chapters

The course is eighteen lessons in three chapters, and they are separated by subject so the topic does not jump around:

1. **Music theory** — eleven lessons on how music is put together: beats and bars, note lengths, tempo and time signature, the twelve notes, intervals, scales, keys and minor, triads, inversions, progressions and cadences, melody. No microphones and no software.
2. **Writing a song** — three lessons on turning that into parts: drums and bass, phrasing and lyrics, song form and arrangement.
3. **The studio** — four lessons on the craft after the song exists: recording a take, editing regions and timing, mixing, and exporting.

Theory comes first and comes complete. Nothing in chapters 2 and 3 uses a musical term that chapter 1 has not already defined.

## How a lesson is laid out

Every lesson has the same shape, so you always know where you are:

1. **What this lesson gives you** — one sentence on what you will be able to do by the end.
2. **Four to six numbered steps.** Each step is one idea: a short heading, a paragraph or two, then either a diagram of exactly what was just described or something to play with. Terms appear in **bold** where they are defined, and nothing is used before it is explained.
3. **Reference** — a table of the lesson's facts in one place.
4. **In short** — the three or four things to remember.
5. **Try it yourself**, then **In GarageBand**.
6. **Check yourself** — one question, at the bottom, about something the lesson has already covered.

The panel on the right is the readiness check — what you should be able to do before moving on, and the box to tick when you can — followed by the list of lessons in this chapter, showing where you are.

## Learning by playing

Every lesson carries at least one thing you operate rather than read. They are inline, so you never leave the explanation to try it:

- **Tap along with a click** and see your timing error in milliseconds.
- **Build a drum pattern** by clicking cells, then play it at any tempo.
- **Press a key** and have it named, or press two and have the interval between them measured.
- **Light up any scale** from any starting note, and watch which black keys appear.
- **Build any triad**, change its quality, and turn it over into its inversions.
- **Put chords in four bars** and hear whether the loop closes or stays open.
- **Draw a melody** on the scale degrees and play it over chords.
- **Switch layers on and off** across the four sections of the sixteen-bar song.
- **Move faders and panners** while a mix loops, and hear a part disappear without being turned down.
- **A/B two versions** of the same thing: major against minor, sloppy against quantised, dry against distant.

## Play the piano

Open **Piano**. This room is for playing pieces rather than building loops: a wide keyboard, a sustain pedal, touch control and MIDI input.

- **Keys** sets how much of the keyboard you can see, from 25 to 61. The shaded keys are the ones your computer keyboard maps; **[** and **]** slide that 25-key window across the range and the keyboard follows it.
- **Sustain** is the pedal. Hold **Space**, or press and hold the button. Notes you release keep ringing until you lift it.
- **Touch** sets how hard every typed note lands, from Pianissimo to Fortissimo, because a computer keyboard cannot sense how hard you press.
- **Voice** chooses the sound. **Grand piano** has a long natural decay; the others are lighter.

For real playing, connect a USB or Bluetooth MIDI keyboard and press **Connect a MIDI keyboard**. Every key arrives with its own velocity, so dynamics work, and a sustain pedal on the controller is read too. Web MIDI works in Chrome and Edge; Safari and Firefox do not support it yet.

Two limits are worth knowing when you play with the computer keyboard. It sends no velocity, so the Touch setting applies to every note equally. Most keyboards also report only about six keys at once, and cheaper ones drop to three, so a full chord under a melody will lose notes. A MIDI keyboard removes both limits.

## Compose and perform

Open **Freestyle**. Under **Genre templates**, choose a style family and a groove. **Preview beat** auditions it. **Load template** copies it into the drum grid along with its meter and tempo. The 37 patterns are original starting points grouped across eight style families.

1. Start the decks. Deck A holds drums and bass. Deck B holds chords and an arpeggio. Each channel has three controls beyond its on/off key:

   - **Part** chooses what that layer actually plays. Bass offers Roots, Octave bounce, Walking, Offbeat push and Driving eighths. Chords offer Sustained pad, Backbeat stabs, Eighth pulse and Offbeat skank. The arpeggio offers Up & down, Climbing, Falling, Wide leaps and Pedal tone.
   - **Rate** sets how often the arpeggio moves: one, two or four notes per beat.
   - **Density** thins a part out. At lower settings notes are dropped in a fixed pattern, so a thinned part repeats the same way each time around rather than flickering at random. On the drums the kick and snare always stay, so the pulse survives.

   **Transpose** in the centre mixer moves bass, chords and arpeggio together, up or down an octave. The crossfader and low-pass filter work across both decks.
2. The four scenes recall a whole arrangement, not just which layers are on. **Intro** thins the drums and slows the arpeggio to one note per beat, **Groove** adds backbeat stabs, **Lift** drives the bass in eighths and runs the arpeggio at four notes per beat, and **Break** drops the rhythm section. Change any control afterwards and the scene button clears, showing you have moved off it.
3. Pick a live instrument. Play the lower white keys with **Q W E R T Y U** (C3–B3) and their black keys with **2 3 5 6 7**. For the higher register, use **Z X C V B N M ,** (C4–C5) and **A S D F G** for the black keys. Hold **Q + E + T** for a C-major chord while playing a melody on the higher row. **[** and **]** shift both registers down or up one octave. Use **Shift + 1–9** or numeric keypad **1–9** for drum hits. The same piano layout also works on the overview and in the Practice room.
4. Set one chord per bar under **Write the chord loop**. To change the drums, open **Practice room → Beat grid**. In 4/4 you can choose 8, 16, 32, or 64 steps. Patterns in 3/4, 6/8, and 12/8 use lengths that fit those meters.
5. Use **Record take** and **Finish take** to capture up to three minutes. Listen back, then save the WAV before closing the tab. For GarageBand, drag the WAV into an audio track or drag an exported beat MIDI into the Tracks area and choose a drum kit. Set the project meter and tempo to match the template.

**Template MIDI** exports the selected original. **Beat MIDI** exports your current grid, including the selected length, swing, tempo and meter. **Undo load** restores the preceding drum pattern.

## Files

- **index.html** contains the entire interactive site.
- **music-cheat-sheet.pdf** is a three-page A4 reference for practice and recording.
- **genre-beats/** contains all 37 MIDI drum templates, organized by style family.
- **window-seat.mid** is the editable 16-bar example. On Mac, create a 96 BPM, 4/4 project in C major and drag the file into the empty Tracks area at bar 1. Set the instrument patches to taste.

For a copy in your Mac repositories folder, extract the **music-learning** folder into **~/Repositories** and open **~/Repositories/music-learning/index.html**.

Progress and notes use your browser’s local storage when available. Stay in the same browser and file location to keep them together. External links in **Sources & further study** open the online guides.
