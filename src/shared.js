// ── Music Theory ─────────────────────────────────────────────────────────────
export const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const FLAT_MAP  = { "Db":"C#","Eb":"D#","Fb":"E","Gb":"F#","Ab":"G#","Bb":"A#","Cb":"B" };
const DISPLAY_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const DISPLAY_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const MAJOR_INTERVALS = [0,2,4,5,7,9,11];
const NNS_NUMERALS = ["1","2","3","4","5","6","7"];

export const KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B","Db","Eb","Gb","Ab","Bb","Am","Em","Dm","Bm","F#m","Cm","Gm"];

export function noteToIndex(note) {
  const n = FLAT_MAP[note] || note;
  return CHROMATIC.indexOf(n);
}
export function indexToNote(idx, preferFlats = false) {
  const i = ((idx % 12) + 12) % 12;
  return preferFlats ? DISPLAY_FLAT[i] : DISPLAY_SHARP[i];
}
export function transposeNote(note, semitones, preferFlats) {
  const idx = noteToIndex(note);
  if (idx === -1) return note;
  return indexToNote(idx + semitones, preferFlats);
}
export function noteToNashville(note, rootNote) {
  const noteIdx = noteToIndex(note);
  const rootIdx = noteToIndex(rootNote);
  if (noteIdx === -1 || rootIdx === -1) return note;
  const interval = ((noteIdx - rootIdx) + 12) % 12;
  const degreeIdx = MAJOR_INTERVALS.indexOf(interval);
  if (degreeIdx === -1) {
    const nextDeg = MAJOR_INTERVALS.findIndex(v => v > interval);
    return "b" + NNS_NUMERALS[nextDeg !== -1 ? nextDeg : 0];
  }
  return NNS_NUMERALS[degreeIdx];
}
const CHORD_RE = /([A-G][b#]?)((?:maj|min|m|M|aug|dim|sus|add|dom)?(?:\d+)?(?:\/[A-G][b#]?)?)/g;
export function transposeChordLine(line, semitones, preferFlats, nashville, rootKey) {
  return line.replace(CHORD_RE, (_, root, quality) => {
    const tr = transposeNote(root, semitones, preferFlats);
    if (nashville) {
      const slashMatch = quality.match(/\/([A-G][b#]?)/);
      const nns = noteToNashville(tr, rootKey);
      const suffix = quality.replace(/\/[A-G][b#]?/, "").replace(/^m(?!aj|in)/, "m");
      if (slashMatch) {
        const bassNote = transposeNote(slashMatch[1], semitones, preferFlats);
        return nns + suffix + "/" + noteToNashville(bassNote, rootKey);
      }
      return nns + suffix;
    }
    const slashMatch = quality.match(/\/([A-G][b#]?)/);
    if (slashMatch) {
      const bassNote = transposeNote(slashMatch[1], semitones, preferFlats);
      return tr + quality.replace(/\/[A-G][b#]?/, "/" + bassNote);
    }
    return tr + quality;
  });
}
export function isChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const chordCount = tokens.filter(t => /^[A-G][b#]?(?:maj|min|m|M|aug|dim|sus|add|\d|\/[A-G])?/.test(t)).length;
  return chordCount / tokens.length >= 0.5;
}

// ── Sample Data ───────────────────────────────────────────────────────────────
export const SAMPLE_SONGS = [
  {
    id: 1, title: "Amazing Grace", artist: "Traditional", key: "G",
    content: `G           G7          C\nAmazing grace how sweet the sound\nG              Em       D\nThat saved a wretch like me\nG          G7       C\nI once was lost but now am found\nG    D      G\nWas blind but now I see`,
  },
  {
    id: 2, title: "Blessed Be Your Name", artist: "Matt Redman", key: "A",
    content: `A              E             F#m          D\nBlessed be Your name in the land that is plentiful\nA               E                D\nWhere Your streams of abundance flow\nA              E              F#m           D\nBlessed be Your name`,
  },
  {
    id: 3, title: "How Great Is Our God", artist: "Chris Tomlin", key: "G",
    content: `G                    Em\nThe splendor of the King clothed in majesty\nC                           D\nLet all the earth rejoice all the earth rejoice\nG                    Em\nHe wraps Himself in light and darkness tries to hide\nC                    D\nAnd trembles at His voice trembles at His voice`,
  },
];

export const SAMPLE_PROGRAM = {
  date: new Date().toISOString().split("T")[0],
  time: "10:00",
  title: "Sunday Worship Service",
  speaker: "",
  sermonTitle: "",
  scripture: "",
  items: [
    { id: "i1", type: "section", label: "Pre-Service" },
    { id: "i2", type: "song", songId: 1 },
    { id: "i3", type: "song", songId: 2 },
    { id: "i4", type: "section", label: "Welcome & Announcements" },
    { id: "i5", type: "section", label: "Opening Prayer" },
    { id: "i6", type: "song", songId: 3 },
    { id: "i7", type: "section", label: "Scripture Reading" },
    { id: "i8", type: "section", label: "Sermon" },
    { id: "i9", type: "section", label: "Offering" },
    { id: "i10", type: "section", label: "Closing Prayer" },
  ],
  notes: "",
};
