// ── Music Theory ─────────────────────────────────────────────────────────────
export const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const FLAT_MAP  = {"Db":"C#","Eb":"D#","Fb":"E","Gb":"F#","Ab":"G#","Bb":"A#","Cb":"B"};
const DSP_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const DSP_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const MAJOR_INT = [0,2,4,5,7,9,11];
const NNS = ["1","2","3","4","5","6","7"];
export const KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B","Db","Eb","Gb","Ab","Bb","Am","Em","Dm","Bm","F#m","Cm","Gm"];

export function noteToIndex(n){const x=FLAT_MAP[n]||n;return CHROMATIC.indexOf(x)}
export function indexToNote(i,f){const x=((i%12)+12)%12;return f?DSP_FLAT[x]:DSP_SHARP[x]}
export function transposeNote(n,s,f){const i=noteToIndex(n);if(i===-1)return n;return indexToNote(i+s,f)}
export function noteToNashville(n,r){const ni=noteToIndex(n),ri=noteToIndex(r);if(ni===-1||ri===-1)return n;const iv=((ni-ri)+12)%12;const di=MAJOR_INT.indexOf(iv);if(di===-1){const nd=MAJOR_INT.findIndex(v=>v>iv);return"b"+NNS[nd!==-1?nd:0]}return NNS[di]}
const CHORD_RE=/([A-G][b#]?)((?:maj|min|m|M|aug|dim|sus|add|dom)?(?:\d+)?(?:\/[A-G][b#]?)?)/g;
export function transposeChordLine(line,s,f,nash,rk){return line.replace(CHORD_RE,(_,root,q)=>{const tr=transposeNote(root,s,f);if(nash){const sm=q.match(/\/([A-G][b#]?)/);const nn=noteToNashville(tr,rk);const sf=q.replace(/\/[A-G][b#]?/,"").replace(/^m(?!aj|in)/,"m");if(sm){const bn=transposeNote(sm[1],s,f);return nn+sf+"/"+noteToNashville(bn,rk)}return nn+sf}const sm=q.match(/\/([A-G][b#]?)/);if(sm){const bn=transposeNote(sm[1],s,f);return tr+q.replace(/\/[A-G][b#]?/,"/"+bn)}return tr+q})}
export function isChordLine(line){const t=line.trim().split(/\s+/).filter(Boolean);if(!t.length)return false;const c=t.filter(x=>/^[A-G][b#]?(?:maj|min|m|M|aug|dim|sus|add|\d|\/[A-G])?/.test(x)).length;return c/t.length>=0.5}

// ── Team Members (edit this list to add/remove members) ──────────────────────
export const TEAM_MEMBERS = [
  { id:1, firstName:"Jacob",  lastName:"Camaro", email:"jacob@cfc.com",  password:"worship1", role:"editor" },
  { id:2, firstName:"Maria",  lastName:"Santos", email:"maria@cfc.com",  password:"worship2", role:"editor" },
  { id:3, firstName:"Paolo",  lastName:"Reyes",  email:"paolo@cfc.com",  password:"view123",  role:"viewer" },
  { id:4, firstName:"Anna",   lastName:"Cruz",   email:"anna@cfc.com",   password:"view123",  role:"viewer" },
];

// ── Sample Songs ─────────────────────────────────────────────────────────────
export const SAMPLE_SONGS = [
  {
    id:1, title:"Amazing Grace", artist:"Traditional", key:"G", semitones:0,
    lyrics:"Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see",
    chords:"G           G7          C\nAmazing grace how sweet the sound\nG              Em       D\nThat saved a wretch like me\nG          G7       C\nI once was lost but now am found\nG    D      G\nWas blind but now I see",
    drums:"Intro: Soft brushes, 4/4\nVerse: Hi-hat on 8ths, light snare on 2 & 4\nChorus: Open hi-hat, full kit\nOutro: Fade with brushes"
  },
  {
    id:2, title:"Blessed Be Your Name", artist:"Matt Redman", key:"A", semitones:0,
    lyrics:"Blessed be Your name in the land that is plentiful\nWhere Your streams of abundance flow\nBlessed be Your name",
    chords:"A              E             F#m          D\nBlessed be Your name in the land that is plentiful\nA               E                D\nWhere Your streams of abundance flow\nA              E              F#m           D\nBlessed be Your name",
    drums:"Intro: Kick & snare, medium tempo\nVerse: Straight 8ths on hi-hat\nChorus: Crash on 1, ride on 2&4\nBridge: Build with toms"
  },
  {
    id:3, title:"How Great Is Our God", artist:"Chris Tomlin", key:"G", semitones:0,
    lyrics:"The splendor of the King clothed in majesty\nLet all the earth rejoice all the earth rejoice\nHe wraps Himself in light and darkness tries to hide\nAnd trembles at His voice trembles at His voice",
    chords:"G                    Em\nThe splendor of the King clothed in majesty\nC                           D\nLet all the earth rejoice all the earth rejoice\nG                    Em\nHe wraps Himself in light and darkness tries to hide\nC                    D\nAnd trembles at His voice trembles at His voice",
    drums:"Intro: Ride cymbal, building\nVerse: Hi-hat pattern, kick on 1\nChorus: Full kit, crash on downbeats\nTag: Big ending on crash"
  },
];

// ── Initial Programs ──────────────────────────────────────────────────────────
export const INITIAL_PROGRAMS = [
  {
    id: "prog-1",
    title: "Sunday Morning Worship",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    speaker: "",
    sermonTitle: "",
    scripture: "",
    notes: "",
    items: [
      { id:"i1", type:"section", label:"Pre-Service", notes:"" },
      { id:"i2", type:"song", songId:1 },
      { id:"i3", type:"song", songId:2 },
      { id:"i4", type:"section", label:"Welcome & Announcements", notes:"" },
      { id:"i5", type:"section", label:"Opening Prayer", notes:"" },
      { id:"i6", type:"song", songId:3 },
      { id:"i7", type:"section", label:"Scripture Reading", notes:"" },
      { id:"i8", type:"section", label:"Sermon", notes:"" },
      { id:"i9", type:"section", label:"Offering", notes:"" },
      { id:"i10", type:"section", label:"Closing Prayer", notes:"" },
    ]
  }
];

// ── Sample Calendar Events ────────────────────────────────────────────────────
export const SAMPLE_EVENTS = [
  { id:"ev1", title:"Music Team Rehearsal", date: new Date().toISOString().split("T")[0], time:"18:00", endTime:"20:00", color:"#E8621A", description:"Weekly rehearsal for worship team", location:"Main Hall" },
  { id:"ev2", title:"Sunday Service", date: new Date(Date.now()+86400000*6).toISOString().split("T")[0], time:"10:00", endTime:"12:00", color:"#2563EB", description:"Regular Sunday worship service", location:"Sanctuary" },
];
