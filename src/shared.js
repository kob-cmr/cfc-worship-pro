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

// ── Convert NNS number (e.g. "1","b3","#5") to standard note given root key ──
export function nashvilleToNote(nnsToken, rootKey, preferFlats=false) {
  const rootIdx = noteToIndex(rootKey.replace("m",""));
  if (rootIdx === -1) return nnsToken;
  // parse flat/sharp prefix and numeral
  const match = nnsToken.match(/^([b#]?)([1-7])$/);
  if (!match) return nnsToken;
  const [, acc, num] = match;
  const degreeIdx = parseInt(num) - 1;
  const semis = MAJOR_INT[degreeIdx];
  if (semis === undefined) return nnsToken;
  const offset = acc === "b" ? semis - 1 : acc === "#" ? semis + 1 : semis;
  return indexToNote(rootIdx + offset, preferFlats);
}

// ── Convert a line that may contain NNS tokens to standard chords ─────────────
// NNS chord pattern: optional b/# + digit + optional quality + optional slash
const NNS_CHORD_RE = /([b#]?[1-7])((?:maj|min|m|M|aug|dim|sus|add|dom)?(?:\d+)?(?:\/[b#]?[1-7])?)/g;
export function isNashvilleLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const nnsCount = tokens.filter(t => /^[b#]?[1-7](?:maj|min|m|M|aug|dim|sus|add|\d|$)/.test(t)).length;
  return nnsCount / tokens.length >= 0.5;
}
export function nashvilleLineToStandard(line, rootKey, preferFlats=false) {
  return line.replace(NNS_CHORD_RE, (_, num, quality) => {
    const note = nashvilleToNote(num, rootKey, preferFlats);
    // handle slash chord bass note
    const slashMatch = quality.match(/\/([b#]?[1-7])/);
    if (slashMatch) {
      const bassNote = nashvilleToNote(slashMatch[1], rootKey, preferFlats);
      return note + quality.replace(/\/[b#]?[1-7]/, "/"+bassNote);
    }
    return note + quality;
  });
}

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
    id:1, title:"Amazing Grace", artist:"Traditional", key:"G", semitones:0, bpm:"72", tempoSig:"3/4",
    sections:[
      { id:"s1-1", type:"Verse", number:1, label:"Verse 1", visible:true,
        chords:"G           G7          C\nG              Em       D",
        lyrics:"Amazing grace how sweet the sound\nThat saved a wretch like me",
        drums:"Soft brushes on snare, hi-hat on 8ths" },
      { id:"s1-2", type:"Verse", number:2, label:"Verse 2", visible:true,
        chords:"G          G7       C\nG    D      G",
        lyrics:"I once was lost but now am found\nWas blind but now I see",
        drums:"Add kick on 1, build slightly" },
      { id:"s1-3", type:"Outro", number:null, label:"Outro", visible:true,
        chords:"G    D    G",
        lyrics:"Was blind but now I see",
        drums:"Fade with brushes" },
    ]
  },
  {
    id:2, title:"Blessed Be Your Name", artist:"Matt Redman", key:"A", semitones:0, bpm:"140", tempoSig:"4/4",
    sections:[
      { id:"s2-1", type:"Verse", number:1, label:"Verse 1", visible:true,
        chords:"A              E             F#m          D\nA               E                D",
        lyrics:"Blessed be Your name in the land that is plentiful\nWhere Your streams of abundance flow",
        drums:"Straight 8ths on hi-hat, kick on 1 & 3" },
      { id:"s2-2", type:"Chorus", number:1, label:"Chorus 1", visible:true,
        chords:"A              E              F#m           D",
        lyrics:"Blessed be Your name",
        drums:"Crash on 1, ride on 2 & 4" },
    ]
  },
  {
    id:3, title:"How Great Is Our God", artist:"Chris Tomlin", key:"G", semitones:0, bpm:"76", tempoSig:"4/4",
    sections:[
      { id:"s3-1", type:"Verse", number:1, label:"Verse 1", visible:true,
        chords:"G                    Em\nC                           D",
        lyrics:"The splendor of the King clothed in majesty\nLet all the earth rejoice all the earth rejoice",
        drums:"Hi-hat pattern, kick on 1, snare on 3" },
      { id:"s3-2", type:"Chorus", number:1, label:"Chorus 1", visible:true,
        chords:"G                    Em\nC                    D",
        lyrics:"He wraps Himself in light and darkness tries to hide\nAnd trembles at His voice trembles at His voice",
        drums:"Full kit, crash on downbeats" },
    ]
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
