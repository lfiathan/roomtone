'use strict';
/* ---------------------------------------------------------------------------
   The course: three chapters, assembled from one file each.

   The chapters are split by subject rather than by difficulty, because the old
   flat list of twelve lessons jumped between music theory and studio work and
   back again. Theory now comes first and comes complete: nothing in chapters 2
   and 3 introduces a musical term that chapter 1 has not already defined.
   Within a chapter, lessons are grouped into modules, so you can see where you
   are in the subject rather than only how far through a list.

   Lesson content lives in course-theory.js, course-writing.js and
   course-studio.js. The shape of a lesson is documented at the top of
   course-theory.js.
--------------------------------------------------------------------------- */

const chapters = [
 {name:'Music theory',
  blurb:'How music is put together: beats and bars, the twelve notes, intervals, scales, chords, progressions and melody. No microphones and no software \u2014 just the vocabulary everything else is built on.',
  modules:['Time','Pitch','Harmony','Melody']},
 {name:'Writing a song',
  blurb:'Turning notes and chords into parts that arrive and leave: who plays what in a groove, where the words sit against the beat, and how sixteen bars become a beginning, a middle and an end.',
  modules:['Groove','Words','Form']},
 {name:'The studio',
  blurb:'The craft after the song exists: setting a project up, recording takes against a click, editing what you captured, balancing the parts, and exporting the two different files a finished song needs.',
  modules:['Recording','Editing','Mixing','Finishing']}
];

const course = [...THEORY, ...WRITING, ...STUDIO];

// A lesson's figures and widgets live inside its blocks, so the index cards and
// the QA suites read them from there. Deriving them once here means a card can
// never illustrate a lesson with a picture the lesson does not contain.
for(const l of course){
 l.figs = l.blocks.filter(b=>b.fig).map(b=>b.fig);
 l.widgets = l.blocks.filter(b=>b.widget).map(b=>b.widget);
 l.fig = l.figs[0];
}

const chapterLessons = j => course.map((l,i)=>[l,i]).filter(([l])=>l.chapter===j);
const chapterDone = j => chapterLessons(j).filter(([,i])=>done.has(i)).length;
const chapterTime = j => chapterLessons(j).reduce((n,[l])=>n+l.time,0);
const courseMinutes = () => course.reduce((n,l)=>n+l.time,0);
