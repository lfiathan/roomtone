// The worked examples all refer to the same 16-bar composition.
const chapters = ['Find your footing', 'Write a musical idea', 'Build the arrangement', 'Record and finish'];
const course = [
{
 title:'Rhythm & time', short:'Feel the pulse, count a bar, and build your first backbeat.', time:12, section:0, art:'rhythm', lab:'beat',
 idea:'A beat is a steady pulse, like footsteps. Rhythm is the pattern you clap while your feet keep walking. Tempo tells you how quickly those footsteps land. A bar groups them so you can hear where a pattern starts again.',
 worked:'At 96 beats per minute, one beat lasts 60 ÷ 96 = 0.625 seconds. In 4/4, four quarter-note beats make a 2.5-second bar. Count the numbers with your feet and say “and” halfway between each pair.',
 cols:['Count','1','&','2','&','3','&','4','&'], rows:[['Kick','●','·','·','·','●','·','·','·'],['Snare','·','·','●','·','·','·','●','·'],['Hi-hat','●','●','●','●','●','●','●','●']],
 steps:['Select 8 steps in the beat grid, load Backbeat and set the tempo to 72 BPM. Tap your foot on every number and clap on 2 and 4 for four bars.','Mute the hi-hats by switching off their eight steps. Keep whispering the “ands” yourself.','Put a kick on the “and” after 3. Your foot stays steady while the kick anticipates beat 4. Bring the tempo up to 96.'],
 gb:'Set a project to 4/4 and 96 BPM. Turn on the metronome and record four bars of claps or single notes. Listen to where your final clap lands.',
 question:'How many eighth notes fill one bar of 4/4?', choices:['Four','Eight','Sixteen'], correct:1, why:'Each of the four quarter-note beats divides into two equal eighth notes. Four pairs give eight.', test:'Count four bars aloud while you clap on 2 and 4 without losing beat 1.'
},{
 title:'Notes & intervals', short:'Find any C on a keyboard and hear the space between two notes.', time:15, section:0, art:'keys', lab:'keys',
 idea:'The keyboard has a repeating map. Find a pair of black keys. The white key immediately to their left is C. Move through the white keys to spell C D E F G A B, then begin again one octave higher.',
 worked:'In the common twelve-tone system, one semitone is the distance to the next key, white or black. C to E takes four semitones: C → C♯ → D → D♯ → E. E to F takes just one. An interval names the distance between two pitches.',
 cols:['From C','Distance','Name'],rows:[['D','2 semitones','Major second'],['E♭ / E','3 / 4 semitones','Minor / major third'],['G / next C','7 / 12 semitones','Perfect fifth / octave']],
 steps:['Play C4 and C5 on the keyboard. Sing the lower note, then sing the upper note. Their names match even though their heights differ.','Play E4 then F4. Next play F4 then G4. Which pair sounds like the smaller step?','Listen to a pair in the ear trainer. Sing it back before choosing an interval. Replay the same pair after reading the explanation.'],
 gb:'On a software piano, record C, E, G and the next C. Open its piano roll. Each row is one semitone, and higher notes appear higher on the grid.',
 question:'Which pair of white keys is one semitone apart?',choices:['C and D','F and G','E and F'],correct:2,why:'E and F are adjacent keys. B and the next C are another white-key semitone.',test:'Find a C without using a label, then sing and play a fifth above it.'
},{
 title:'Scales & keys',short:'Give your melody a home note and a set of pitches to explore.',time:15,section:0,art:'scale',lab:'keys',
 idea:'Think of the tonic as home. A scale arranges pitches around that home in order. A major scale uses the same pattern of whole steps (W, two semitones) and half steps (H, one semitone) wherever it begins.',
 worked:'Starting on C, walk W W H W W W H to get C D E F G A B C. Start on G and the same walk gives G A B C D E F♯ G. F♯ is needed to keep the final half step.',
 cols:['Scale','Ordered notes','Home'],rows:[['C major','C D E F G A B C','C'],['G major','G A B C D E F♯ G','G'],['A natural minor','A B C D E F G A','A']],
 steps:['In Keys & harmony, listen to C major ascending. Play the same notes backward and hold the last C.','Switch to G major. Name the one pitch that changes from the C-major collection.','Use only A B C D E F G. End three short phrases on A over an A-minor chord. Listen for the new sense of home.'],
 gb:'Record a sustained C chord. On another track, play C D E G, pause, then return to C. Changing the project key signature alone will not write a melody for you.',
 question:'Which note belongs to G major?',choices:['F♯','F natural','G♭ instead of G'],correct:0,why:'The seventh scale degree is F♯, a half step below the tonic G.',test:'Build G major from the step pattern and identify its tonic by ear.'
},{
 title:'Chords & voicings',short:'Stack thirds, change one note, and hear a chord change color.',time:18,section:1,art:'keys',lab:'keys',
 idea:'A triad is a group of three pitches built by stacking thirds. The root gives it a name. The third makes the major/minor difference. A voicing chooses the octave and order in which the pitches sound.',
 worked:'Take alternate notes of C major: C, E and G. Measured from C they sit at 0, 4 and 7 semitones, a major triad. Lower E to E♭ and the result is C minor. For a C-major inversion, keep the same notes and put E or G in the bass.',
 cols:['Chord type','Semitones from root','Example'],rows:[['Major / minor','0 4 7 / 0 3 7','C E G / C E♭ G'],['Diminished / augmented','0 3 6 / 0 4 8','B D F / C E G♯'],['Dominant seventh','0 4 7 10','G B D F']],
 steps:['In the practice room compare C major and C minor. Sing the one pitch that moves.','Play C–E–G, E–G–C and G–C–E. Listen for the bass moving while the chord name stays the same.','Move from C–E–G to C–F–A. Hold the common C and move the two other fingers a small distance.'],
 gb:'Enter a C triad in a software instrument region. Duplicate the region, then move just the E down one row in the piano roll to compare the two colors.',
 question:'E–G–C, with E lowest, is which chord?',choices:['E minor','C major in first inversion','G major'],correct:1,why:'The pitches still spell C–E–G. Placing the third, E, in the bass makes the first inversion.',test:'Build a minor triad from a root and explain which pitch you would raise to make it major.'
},{
 title:'Chord progressions',short:'Turn four chords into a loop and use a cadence to finish.',time:18,section:1,art:'scale',lab:'keys',
 idea:'A progression is a sequence of chords. Roman numerals describe roots relative to a key. Uppercase commonly means major and lowercase means minor. The same numbers can move a song to a new key.',
 worked:'In C major, I–V–vi–IV means C–G–Am–F. Hold each chord for one bar. The loop can return from F to C. For a stronger traditional close, play G then C and listen for the leading tone B rising to C.',
 cols:['Degree','I','ii','iii','IV','V','vi','vii°'],rows:[['C major','C','Dm','Em','F','G','Am','Bdim'],['G major','G','Am','Bm','C','D','Em','F♯dim']],
 steps:['Play C, G, Am, F in order at one chord per bar. Sing each root as the harmony changes.','In G, use the second row to find I–V–vi–IV. Keep the rhythm identical.','Record a second ending. Replace your last two chords with G–C and compare how final each ending feels.'],
 gb:'Record the four-bar loop once. Trim the region edges to bar lines and loop it. Make a separate copy if you want to edit a different ending independently.',
 question:'What is I–V–vi–IV in G major?',choices:['G–C–D–Em','G–D–Em–C','G–Dm–E–C'],correct:1,why:'Use roots 1, 5, 6 and 4 in G major. The sixth-degree triad is minor.',test:'Play the loop in two keys and create an ending that settles on the tonic.'
},{
 title:'Melody & motifs',short:'Write a short musical phrase somebody could sing back.',time:20,section:1,art:'wave',lab:'keys',
 idea:'A motif is a small recognizable shape, often just a few pitches and a rhythm. A melody grows when you repeat that shape, change one part, and give the listener a place to breathe.',
 worked:'The hook of Window Seat starts E4 G4 A4 G4 in quarter notes over C. E and G belong to the chord. A moves away and comes back to G. In the next bar the melody reaches D5, providing a point of contrast.',
 cols:['Hook bar','Chord','Notes and lengths'],rows:[['9','C','E4(1) G4(1) A4(1) G4(1)'],['10','G','G4(1) B4(1) D5(2)'],['11','Am','C5(1) E5(1) A4(2)'],['12','F','A4(1) G4(1) F4(2)']],
 steps:['Sing bar 9 over the chord C. The number in parentheses is the number of beats to hold.','Repeat the rhythm but start your new phrase on G. End on a chord tone when the chord changes.','Record two endings. Leave beat 4 silent in one of them. Sing both versions without accompaniment and choose the one you remember.'],
 gb:'Choose a lead sound that stands apart from the chord instrument. Record a hummed take or a software-instrument line. Keep one take for comparison.',
 question:'How many beats does D5 take in bar 10?',choices:['One','Two','Four'],correct:1,why:'G and B take one beat each, leaving two beats for the held D.',test:'Sing a two-bar hook from memory and point to one repeat and one variation.'
},{
 title:'Drums & bass',short:'Give the kick, snare and bass distinct jobs in the groove.',time:18,section:2,art:'rhythm',lab:'beat',
 idea:'A groove comes from the relationship between parts. The kick anchors the pattern, the snare can mark a backbeat, and shorter hi-hats reveal the subdivisions. The bass connects that rhythm to the chord roots.',
 worked:'For bar 9, put kicks on 1 and 3, snares on 2 and 4, and hats on all eight eighth notes. Play C2 on beats 1 and 3 under the C chord. Moving one bass attack to the “and” after 2 changes the push into beat 3.',
 cols:['Layer','Verse, bars 5–8','Hook, bars 9–12'],rows:[['Bass','Root on 1','Root on 1 and 3'],['Kick / snare','Kick 1, snare 4','Kick 1 & 3, snare 2 & 4'],['Hat','Quarter notes','Eighth notes']],
 steps:['Program the hook pattern in the beat grid. Listen once to kick and snare only.','Add hats, then remove every other hat. Notice how the beat feels less busy even at the same BPM.','Sing or play the roots C, G, A, F against the groove. Leave space before the next chord change.'],
 gb:'Use a software drum kit or a Drummer track. Add a separate bass track. Solo the pair and check whether the start of each bass note supports the kick.',
 question:'How can you make a hook busier while keeping its tempo?',choices:['Double the hi-hat subdivision','Double the BPM only','Change the key signature'],correct:0,why:'Adding eighth-note hats increases rhythmic activity while the quarter-note pulse stays fixed.',test:'Build two grooves at the same tempo and explain one rhythm change you hear.'
},{
 title:'Lyrics & phrasing',short:'Fit a sung line to the beat or shape an instrumental hook.',time:20,section:2,art:'wave',lab:'beat',
 idea:'Speech already has rhythm. Start with one concrete image and say it naturally. Put its important syllables where the melody gives them weight. A verse can show a scene while a chorus repeats its central idea.',
 worked:'For a song called Window Seat, try “Rain on the window.” Speak RAIN on the WIN-dow. In 4/4, place RAIN on 1, “on” on 2, “the” on the “and” of 2, WIN on 3 and “dow” on 4. The ordinary word stresses still come through.',
 cols:['Count','1','&','2','&','3','&','4','&'],rows:[['Words','RAIN','—','on','the','WIN','—','dow','—']],
 steps:['Write one sentence about something you can see. Underline the two syllables you naturally stress.','Clap a bar, speak your sentence against it and shorten any word that feels rushed. Record a rough take.','Sing it on three pitches. For an instrumental, play the same syllable rhythm on a keyboard. Leave a breath before repeating.'],
 gb:'Use Audio Recorder or a microphone track for a scratch vocal. A rough recording captures the rhythm of your words before you choose a final melody.',
 question:'Which step helps a line sound natural when sung?',choices:['Give every syllable equal stress','Always rhyme on beat one','Listen to the stressed syllables in speech'],correct:2,why:'The melody and rhythm can reinforce the natural accents of the words.',test:'Record one line with clear word stress and one deliberate breath.'
},{
 title:'Song form & arrangement',short:'Turn a repeating loop into sections with a beginning and ending.',time:20,section:2,art:'arrange',lab:'project',
 idea:'Form is the order of sections. Arrangement decides which parts play in those sections. You can make a chorus feel bigger by changing register, rhythm, or instrumentation while the harmony stays familiar.',
 worked:'Window Seat uses four sections of four bars each. At 96 BPM in 4/4, each section lasts 10 seconds. The hook arrives at 0:20 because eight bars have already passed.',
 cols:['Bars','Section','Change the texture'],rows:[['1–4','Intro','Chords alone'],['5–8','Verse','Add bass and a light beat'],['9–12','Hook','Add lead and eighth-note hats'],['13–16','Outro','Drop drums and lead. End on C.']],
 steps:['Draw four boxes for these sections. Write down one musical change at each boundary.','Play the song project and follow the section readout. Listen to the exact point where the hook enters.','Make a new arrangement using the same notes. Try dropping the drums for one bar before the hook.'],
 gb:'On Mac, arrange independent regions across the ruler. On iPhone or iPad, set the song section length to 16 bars or add four sections of four bars.',
 question:'At this tempo, when does bar 9 begin?',choices:['0:10','0:20','0:40'],correct:1,why:'Eight completed bars × four beats × 0.625 seconds = 20 seconds.',test:'Identify all four sections by ear and explain how your arrangement marks the hook.'
},{
 title:'Recording & editing',short:'Capture a take, trim a region, and repair a timing slip.',time:22,section:3,art:'wave',lab:'garageband',
 idea:'Audio stores sound as a waveform. MIDI stores events such as pitch, start time, duration and velocity. A track holds regions. Move a region to change where a part plays in the song.',
 worked:'If one piano note arrives late, open the MIDI region and move that note left. A voice recording is audio: split at a suitable gap and move or re-record the phrase. Keep an untouched take before trying edits.',
 cols:['Edit','What it changes'],rows:[['Trim','Start or end boundary of a region'],['Quantize','Timing toward a chosen subdivision'],['Velocity','Strength of a MIDI note attack'],['Split','Divides a region at a chosen point']],
 steps:['Record four bars with a count-in. Name the track and save a copy of the first take.','Listen with the metronome. Identify one early or late note and move it by hand.','Try an eighth-note quantize on a duplicated MIDI passage played in eighths. Compare the corrected and original versions with the click off.'],
 gb:'Follow the Record and Edit steps in the GarageBand guide for your device. Use headphones if an open microphone picks up the backing track.',
 question:'Which take lets you edit a single wrong pitch in the piano roll?',choices:['A recording from a microphone','A software-instrument MIDI region','An exported stereo mix'],correct:1,why:'The piano roll exposes individual MIDI note events.',test:'Save an editable session containing both an original take and a corrected region.'
},{
 title:'Mixing & space',short:'Make the lead audible through level, placement, and tone.',time:20,section:3,art:'arrange',lab:'garageband',
 idea:'Start with relative volume. Pan moves a part across the stereo field. EQ changes the level of frequency ranges. Compression reduces level differences above a threshold. Reverb adds a sense of reflected space.',
 worked:'If the hook disappears when the chords enter, pull the chord level down first. If it still feels crowded, try moving the chord voicing higher or reducing an overlapping frequency range. Compare at similar listening levels.',
 cols:['You hear','First experiment'],rows:[['Lead buried','Lower the competing instrument'],['Bass feels blurred','Shorten bass notes or thin low chords'],['Words sound distant','Reduce vocal reverb'],['Crunch on loud hits','Check input and output meters for clipping']],
 steps:['Bring up the most important part first, then add drums, bass and chords one at a time.','Listen quietly. Lower one competing part until you can hum the hook clearly. Compare the loudest section before and after.','Listen on headphones and a speaker. Write one specific observation and change only one control before replaying.'],
 gb:'Use track volume and pan first. On Mac open Smart Controls for EQ and effects. On mobile use Track Controls and Plug-ins & EQ. Check the master output during the hook.',
 question:'The lead is buried under the piano. What is a useful first move?',choices:['Raise every track','Add more reverb','Lower the piano level'],correct:2,why:'A relative-level change creates space immediately and helps identify the real conflict.',test:'Hear the hook clearly at low volume and play the loudest section without clipping.'
},{
 title:'Export & revise',short:'Finish an editable project and a stereo file you can share.',time:12,section:3,art:'scale',lab:'garageband',
 idea:'A project preserves tracks and edits. A stereo bounce combines the performance into a playable audio file. An exported copy lets you listen away from the timeline and hear the song as a listener.',
 worked:'Window Seat is sixteen bars, or roughly forty seconds. If an export contains only four bars, check the selected cycle or export range. Leave room for the final sound to decay, then listen all the way through.',
 cols:['Deliverable','Purpose'],rows:[['GarageBand project','Keep editing tracks and regions'],['WAV / AIFF','Uncompressed stereo copy'],['AAC / MP3','Smaller listening copy; format options vary by device']],
 steps:['Save the editable song under a clear version name. Set the end after the last intended sound.','Export a stereo copy. Open it outside GarageBand. Check the first beat, hook entrance, final chord and tail.','Listen once without touching any controls. Note one change for version two. Preserve the first export for a fair comparison.'],
 gb:'On Mac use Share → Export Song to Disk. On iPhone or iPad, touch and hold the song in My Songs, then choose Share → Song, choose quality, and save.',
 question:'Which file should you keep for revising one bass note next week?',choices:['The editable project','Only the MP3','A screenshot of the mixer'],correct:0,why:'The project retains tracks, regions and MIDI events for revision.',test:'Deliver a playable stereo export and reopen the editable project successfully.'
}];
