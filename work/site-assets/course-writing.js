'use strict';
/* ---------------------------------------------------------------------------
   Chapter 2 — Writing a song.

   Theory gave you notes, chords and a tune. This chapter is about turning
   those into something with parts that enter and leave: who plays what, where
   the words sit, and how sixteen bars become a beginning, a middle and an end.

   Same block shape as chapter 1 — see the header of course-theory.js.
--------------------------------------------------------------------------- */

const WRITING = [
{
 title:'Drums and bass', short:'Give the kick, snare, hats and bass separate jobs so the groove holds together.',
 time:18, chapter:1, module:'Groove', tag:'Groove layers', lab:'beat',
 opens:'By the end you can build a groove where each instrument has one job, and lock a bass line to the kick.',
 blocks:[
  {h:'The rhythm section is a division of labour',
   p:['A groove is not one rhythm — it is three or four simple rhythms that agree with each other. Each instrument takes one job and stays out of the others’ way. That is the whole trick, and it is why a four-piece pattern made of trivially simple parts sounds better than one clever part doing everything.',
      'The standard division: the kick marks the structure, the snare marks the backbeat, the hi-hat keeps the subdivision ticking, and the <b>bass</b> connects the drums to the harmony. Four parts, four jobs.'],
   fig:{kind:'grid',beats:4,div:2,cw:40,laneWidth:84,
    lanes:[
     {name:'Hi-hat',tone:'blue',on:[0,1,2,3,4,5,6,7]},
     {name:'Snare',tone:'orange',on:[2,6]},
     {name:'Kick',tone:'green',on:[0,3,4]},
     {name:'Bass',tone:'slate',on:[0,3,4],text:{0:'C',3:'C',4:'C'}}],
    alt:'A four-lane groove: hi-hat on all eight half beats, snare on 2 and 4, kick on 1, the and of 2, and 3, with the bass matching the kick.',
    caption:'Four parts, one bar. The hi-hat ticks every half beat. The snare takes 2 and 4. The kick takes beat 1, the “&” after 2, and beat 3. The <b>bass follows the kick exactly</b> — same three positions — which is what makes the bottom of a mix sound like one instrument rather than two.'}},
  {h:'Lock the bass to the kick',
   p:['The single most effective thing you can do for a groove is put the bass notes on the same positions as the kick drum. Low frequencies take time to develop, and two low sounds arriving a fraction apart turn to mush. On the same position they reinforce each other and the bottom end gets solid.',
      'Once the pattern is locked you can loosen it deliberately. A bass note that arrives slightly before the kick pushes the groove; one that lands slightly after relaxes it. But learn the locked version first, because you cannot break a rule you have not yet heard working.'],
   widget:{kind:'steps',beats:4,div:2,tempo:96,min:70,max:130,
    title:'Build a four-part groove',
    hint:'Start by playing it as it is. Then move one bass hit off its kick and listen to the bottom end lose focus.',
    lanes:[
     {name:'Hi-hat',id:'hat',on:[0,1,2,3,4,5,6,7],level:.45},
     {name:'Snare',id:'snare',on:[2,6]},
     {name:'Kick',id:'kick',on:[0,3,4]},
     {name:'Bass',id:'tom',on:[0,3,4],level:.7}],
    say:'The bottom lane stands in for the bass. Keep it on the same columns as the kick and the groove feels planted.'}},
  {h:'Space is an instrument',
   p:['Beginners fill every position; the pattern gets busy and stops grooving. Almost every great drum part has large empty areas, and the empty areas are what make the hits land.',
      'A reliable exercise: take a pattern you like and remove a third of its hits. Nine times out of ten it improves. If you cannot decide what to cut, cut hi-hats first — they are the easiest layer to over-fill and the least missed.']},
  {h:'Where the bass notes come from',
   p:['Rhythm is half the bass line; the other half is which notes. The default is the root of whatever chord is playing — in bar one of a C chord, play C. It is unglamorous and it always works, because it tells the listener what the harmony is.',
      'Two upgrades once the roots are solid. Play the fifth as well as the root for movement inside a bar. And on the last beat before a chord change, step towards the next root rather than repeating the current one: a <b>walk-up</b> or <b>walk-down</b> of one or two scale steps. That single moving note is what makes a bass line sound played rather than programmed.'],
   fig:{kind:'contour',beatW:38,h:170,
    bars:[
     {bar:1,chord:'C',notes:[{midi:36,beats:2,tone:'green'},{midi:43,beats:1,tone:'soft'},{midi:38,beats:1,tone:'rust'}]},
     {bar:2,chord:'G',notes:[{midi:31,beats:2,tone:'blue'},{midi:38,beats:1,tone:'soft'},{midi:33,beats:1,tone:'rust'}]},
     {bar:3,chord:'Am',notes:[{midi:33,beats:2,tone:'orange'},{midi:40,beats:1,tone:'soft'},{midi:36,beats:1,tone:'rust'}]},
     {bar:4,chord:'F',notes:[{midi:29,beats:3,tone:'slate'},{midi:35,beats:1,tone:'rust'}]}],
    alt:'A four-bar bass line showing the root held for two beats, then the fifth, then a stepwise note leading into the next bar.',
    caption:'Four bars of bass under C–G–Am–F. Each bar holds its root for two beats, touches the fifth on beat 3, then uses beat 4 (in rust) to <b>step towards the next bar’s root</b>. Those rust notes are the whole difference between a bass line and a list of roots.'}}
 ],
 tableLead:'Who does what, and what to check when a groove is not working:',
 cols:['Part','Job','Usually plays','If it sounds wrong'],
 rows:[['Kick','Marks the structure','1 and 3, plus one syncopation','Too many hits — remove one'],['Snare','Marks the backbeat','2 and 4','Moved off 2 and 4 by accident'],['Hi-hat','Keeps the subdivision','Every eighth or sixteenth','Too loud, or too busy'],['Bass','Joins drums to harmony','Chord roots, on the kick positions','Not aligned with the kick'],['Everything','—','—','Not enough silence']],
 recap:['A groove is several simple parts each doing one job, not one complicated part.','Put bass notes on the same positions as the kick so the low end stays solid.','Removing hits usually improves a pattern; cut hi-hats first.','Play chord roots, add the fifth for movement, and step into the next chord on the last beat.'],
 steps:['In the beat grid, load the Backbeat preset and play it. Add one kick on the “&” after beat 2 and nothing else.','Remove every second hi-hat so it plays quarters instead of eighths. Decide which version you prefer and be able to say why.','Play the chord loop on the keys lab and sing the root of each chord as it changes. That sung line is your bass part.'],
 gb:'Record drums and bass as separate tracks so you can mute one and hear the other. If the bottom end sounds vague, zoom in on the kick and bass notes and check that they start at the same point on the grid.',
 question:'Why put bass notes on the same positions as the kick drum?', choices:['It is easier to play','Two low sounds a fraction apart turn to mush','It makes the song louder','So the bass can be heard over the snare'], correct:1,
 why:'Low frequencies need time to develop. Aligned, the kick and bass reinforce each other; a fraction apart, they smear into each other and the bottom of the mix loses definition.',
 test:'Build a four-part groove from scratch where each part plays one job, then play the chord roots over it in time.'
},{
 title:'Phrasing and lyrics', short:'Fit words to the beat, or shape an instrumental hook that breathes.',
 time:19, chapter:1, module:'Words', tag:'Word stress', lab:'beat',
 opens:'By the end you can place a line of words so its natural stresses land on strong beats, and leave room to breathe.',
 blocks:[
  {h:'Words already have a rhythm',
   p:['Every word in English has a built-in stress pattern. “Window” is WIN-dow, never win-DOW. Phrases inherit it: “the window seat” has its weight on WIN. When you set words to music you are not inventing a rhythm, you are finding the one the words already have and lining it up with the beat.',
      'The failure mode is unmistakable. Put a stressed syllable on a weak beat and the line sounds like a robot reading a shopping list. Singers then fight the melody to make it sound natural, which is a problem you created and they have to solve.']},
  {h:'Stressed syllables on strong beats',
   p:['The rule is almost mechanical: stressed syllables go on beats 1 and 3, and anything unstressed fills the spaces between. Say your line out loud, exaggerating its natural stresses, and write down where the weight falls. That is your rhythm before you write a single note.',
      'The grid below shows a four-syllable line placed well. Say it along with the figure, then imagine “seat” arriving on an “and” instead and hear how wrong it becomes.'],
   fig:{kind:'grid',beats:4,div:2,cw:42,laneWidth:92,
    lanes:[
     {name:'Syllables',tone:'orange',on:[0,2,4,6],text:{0:'WIN',2:'dow',4:'SEAT',6:'—'}},
     {name:'Stress',tone:'green',on:[0,4],text:{0:'strong',4:'strong'}},
     {name:'Snare',tone:'blue',on:[2,6]}],
    alt:'A bar showing the syllables WIN-dow-SEAT placed on beats 1, 2 and 3, with the stressed syllables on beats 1 and 3 and beat 4 left empty.',
    caption:'“<b>WIN</b>-dow <b>SEAT</b>” across one bar. The two stressed syllables land on beats 1 and 3, the strong beats. Beat 4 is deliberately empty — that gap is where the singer breathes and where the listener catches up.'},
   widget:{kind:'steps',beats:4,div:2,tempo:84,min:60,max:120,
    title:'Place a line on the beat',
    hint:'Each lane is one syllable of “WIN-dow SEAT”. Move the stressed ones off beats 1 and 3 and hear the line stop sounding like English.',
    lanes:[
     {name:'WIN (strong)',id:'kick',on:[0]},
     {name:'dow (weak)',id:'hat',on:[2],level:.5},
     {name:'SEAT (strong)',id:'kick',on:[4]},
     {name:'Snare',id:'snare',on:[2,6],level:.6}],
    say:'Say the words out loud with it. When a strong syllable sits on an “&”, you will hear the line trip.'}},
  {h:'Leave the last beat alone',
   p:['A four-bar phrase that fills every beat has nowhere to breathe. Singers need air and listeners need a gap to process what they just heard. The simplest fix in songwriting is to end each two-bar phrase a beat early.',
      'This is also where <b>call and response</b> comes from: a vocal line for two bars, then two bars of instrumental answer. The gap is not wasted space, it is the other half of the conversation.']},
  {h:'Rhyme marks the structure',
   p:['Rhyme is not decoration — it tells the listener where the lines end, which is how they hear the shape of a verse without being told. The common schemes are AABB (couplets: punchy, simple) and ABAB (alternating: more flowing). Pick one and stay with it inside a section, or the structure stops being audible.',
      'Two things matter more than finding a perfect rhyme. Keep line lengths consistent, so each one occupies the same number of bars. And put your best image at the end of a line, where the rhyme draws attention to it.']},
  {h:'If there are no words',
   p:['Instrumental hooks follow exactly the same rules, with the stresses coming from note length and register instead of syllables. A long note or a high note functions as a stressed syllable, so put those on strong beats.',
      'And treat the hook as if it had to be sung even when it does not. Leave gaps where a singer would breathe. A melody that never rests is tiring whether or not anyone has to perform it.'],
   fig:{kind:'grid',beats:4,div:2,cw:42,laneWidth:92,
    lanes:[
     {name:'Hook (bars 1–2)',tone:'blue',on:[0,2,4],text:{0:'E',2:'G',4:'A'}},
     {name:'Answer (bars 3–4)',tone:'slate',on:[8,10,12],text:{8:'G',10:'F',12:'E'}}],
    counts:['1','&','2','&','3','&','4','&'],
    alt:'Two lanes showing a hook occupying the first three beats and an instrumental answer occupying the equivalent beats two bars later.',
    caption:'<b>Call and response.</b> The hook states three notes and stops on beat 4. Two bars later the answer replies with the same rhythm and a falling shape. Neither line fills its bar, and the song is easier to follow for it.'}}
 ],
 tableLead:'Four ways to split a four-bar phrase, and what each one does:',
 cols:['Shape','Bars','Effect'],
 rows:[['One long line','4','Spacious, hard to remember'],['Two matched lines','2 + 2','The default. Easy to follow'],['Call and response','2 vocal + 2 instrumental','Conversational, leaves room'],['Three and one','3 + 1','Builds, then answers quickly'],['Four short lines','1 + 1 + 1 + 1','Urgent, list-like, tiring if overused']],
 recap:['Words carry their own stress; find it before writing notes.','Stressed syllables belong on beats 1 and 3.','Leave the last beat of a phrase empty so the line can breathe.','Keep one rhyme scheme per section, and put your best image at the line end.'],
 steps:['Write one line of eight syllables about a place. Say it aloud and mark which syllables are stressed.','On the beat grid, place your stressed syllables on beats 1 and 3 and fit the rest around them. Leave beat 4 of the second bar empty.','Record or tap your line over the four-chord loop. If any word feels forced, move it rather than changing the word.'],
 gb:'Record a scratch vocal early, even if you cannot sing — it is a timing reference, not a performance. Knowing where the words land tells you where the arrangement has to leave space.',
 question:'Where should a stressed syllable normally fall?', choices:['On an “and” between beats','On beats 1 and 3','Anywhere, as long as it rhymes','On beat 4'], correct:1,
 why:'Beats 1 and 3 are the strong beats of a 4/4 bar. Putting a naturally stressed syllable anywhere else makes the line fight the pulse and sound unnatural.',
 test:'Say a line of your own aloud, mark its stresses, and place it on a bar so the stresses land on 1 and 3.'
},{
 title:'Song form and arrangement', short:'Turn a repeating loop into sections that arrive, build and end.',
 time:20, chapter:1, module:'Form', tag:'Sixteen bars', lab:'project',
 opens:'By the end you can lay out a sixteen-bar song in sections and decide which parts play in each one.',
 blocks:[
  {h:'Form is the plan; arrangement is what plays',
   p:['Two separate decisions, often confused. <b>Form</b> is the order and length of the sections: intro, verse, chorus, verse, chorus, bridge, chorus. <b>Arrangement</b> is which instruments play in each of those sections, and how densely.',
      'You can keep one chord loop running for an entire song and still have a song that goes somewhere, purely through arrangement. That is how an enormous amount of modern music works, and it is the most efficient skill in this chapter: the chords stay put, the <i>layers</i> tell the story.']},
  {h:'Sections in multiples of four',
   p:['Sections are almost always four, eight or sixteen bars long, because listeners count in fours without noticing and a section that breaks the pattern feels like a mistake rather than a surprise.',
      'This course builds a sixteen-bar song in four four-bar sections: an intro, a verse, a hook, and an outro. Sixteen bars at 96 BPM is forty seconds — short, but a complete piece of music with a beginning and an end, which is far more useful as a first finished thing than three minutes of unfinished one.'],
   fig:{kind:'timeline',bars:16,bw:30,laneWidth:84,
    sections:[{from:1,to:4,name:'Intro',sub:'bars 1–4',tone:'pale'},{from:5,to:8,name:'Verse',sub:'bars 5–8',tone:'soft'},
              {from:9,to:12,name:'Hook',sub:'bars 9–12',tone:'orange'},{from:13,to:16,name:'Outro',sub:'bars 13–16',tone:'slate'}],
    lanes:[
     {name:'Chords',tone:'green',spans:[{from:1,to:16,label:'C · G · Am · F, round and round'}]},
     {name:'Drums',tone:'blue',spans:[{from:5,to:12,label:'enters at bar 5'}]},
     {name:'Bass',tone:'slate',spans:[{from:5,to:12,label:'with the drums'}]},
     {name:'Lead',tone:'orange',spans:[{from:9,to:12,label:'hook only'}]}],
    marks:[{at:9,label:'hook enters'}],
    alt:'A sixteen-bar arrangement in four sections. Chords run throughout; drums and bass enter at bar 5; the lead plays only bars 9 to 12.',
    caption:'The whole song on one page. The chord loop never changes across all sixteen bars. Everything you hear as structure comes from <b>entrances</b>: drums and bass arrive at bar 5, the lead arrives at bar 9, and both leave for the outro. The dashed line is the moment the song is about.'},
   widget:{kind:'arrange',tempo:96,sections:['Intro','Verse','Hook','Outro'],
    on:[[false,true,true,false],[false,true,true,false],[true,true,true,true],[false,false,true,false]],
    title:'Arrange the sixteen bars yourself',
    hint:'Rows are layers, columns are four-bar sections. Press play for the whole song, then take the drums out of the hook and listen to what that costs.',
    say:'Four sections, four layers. Everything that makes this sound like a song rather than a loop is in this grid.'}},
  {h:'Build by addition, not by volume',
   p:['The instinct when a section needs to feel bigger is to turn things up. That almost never works, because loud and dense are different things and listeners respond to density.',
      'Add a layer instead. The hook in the arrangement above feels like an arrival because two things happen at bar 9: the lead enters, and the hi-hats double from quarters to eighths. Nothing got louder. There is simply more going on, and more going on reads as bigger.']},
  {h:'Taking things away is the other half',
   p:['An entrance only works if something was absent before it. That means planning your <i>removals</i> as deliberately as your additions. The intro has no drums so that bar 5 can land; the outro drops the lead so the song can finish rather than stop.',
      'The most reliable trick in arranging is the one-bar drop: take everything out except one layer for a single bar just before a chorus. The silence makes the next entrance feel twice its size, and it costs you nothing.']},
  {h:'How sections are usually ordered',
   p:['Beyond sixteen bars, the common forms are worth knowing. <b>Verse–chorus</b> alternates a changing story with a repeating payoff. <b>AABA</b> states an idea twice, departs, and returns — standard in jazz and older songwriting. <b>Verse–prechorus–chorus</b> adds a short ramp whose only job is to make the chorus feel inevitable.',
      'Whichever you use, the chorus should be the densest, highest and most repetitive part of the song. If your verse is busier than your chorus, the song will feel like it is going backwards.']}
 ],
 tableLead:'The sixteen bars of the example song, section by section:',
 cols:['Bars','Section','Chords','What plays'],
 rows:[['1–4','Intro','C · G · Am · F','Chords alone, one per bar'],['5–8','Verse','C · G · Am · F','Add bass roots and a light beat'],['9–12','Hook','C · G · Am · F','Add the lead, the backbeat and eighth-note hats'],['13–16','Outro','C · G · F · C','Chords alone again; hold the final C']],
 recap:['Form is the order of sections; arrangement is what plays in each one.','Sections come in fours — four, eight or sixteen bars.','Make a section feel bigger by adding a layer, not by raising the volume.','Plan what is absent, so that entrances have something to arrive from.'],
 steps:['In the arrangement widget, play all sixteen bars as they are and name the bar where the song changes character.','Switch the drums on for the intro. The hook stops being an arrival — that is the cost of starting full.','Turn everything off for the Verse except chords, then build it back one layer at a time, listening after each.'],
 gb:'Use the arrangement markers or section regions to label bars 1–4, 5–8, 9–12 and 13–16 before you record. Deciding the shape first saves rewriting it later with audio already in place.',
 question:'What is the most reliable way to make a chorus feel bigger?', choices:['Turn everything up','Add a layer that was not playing before','Change key','Speed up the tempo'], correct:1,
 why:'Listeners respond to density more than loudness. An entrance works because something was absent before it, which is why planning removals matters as much as additions.',
 test:'Lay out a sixteen-bar arrangement naming which of four layers plays in each section, and justify every entrance.'
}
];
