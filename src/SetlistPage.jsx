import { useState } from "react";
import { KEYS, transposeNote, transposeChordLine, isChordLine } from "./shared.js";

function SongDisplay({ song, useFlats, nashville, displayMode }) {
  // Per-song semitones stored on song object itself
  const semitones = song.semitones || 0;
  const rootForNashville = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootForNashville + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");
  const lines = song.content.split("\n").map((line, i) => {
    const chord = isChordLine(line);
    if (chord) {
      if (displayMode === "lyrics") return null;
      const t = transposeChordLine(line, semitones, useFlats, nashville, rootForNashville);
      return <div key={i} className="chord-line">{t || "\u00A0"}</div>;
    }
    if (displayMode === "chords") return null;
    return <div key={i} className="lyric-line">{line || "\u00A0"}</div>;
  });
  return (
    <div className="song-display">
      <div className="song-display-header">
        <div>
          <div className="song-display-title">{song.title}</div>
          <div className="song-display-artist">{song.artist}</div>
        </div>
        <div className="key-badge">{nashville ? "NNS" : effectiveKey}</div>
      </div>
      <div className="song-content">{lines}</div>
    </div>
  );
}

function SongEditor({ song, onSave, onCancel }) {
  const [form, setForm] = useState({ ...song });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="editor-overlay">
      <div className="editor-card">
        <h2 className="editor-title">{song.id ? "Edit Song" : "New Song"}</h2>
        <div className="editor-row">
          <div className="editor-field">
            <label>Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Song title" />
          </div>
          <div className="editor-field">
            <label>Artist</label>
            <input value={form.artist} onChange={e => set("artist", e.target.value)} placeholder="Artist name" />
          </div>
        </div>
        <div className="editor-field editor-field-sm">
          <label>Original Key</label>
          <select value={form.key} onChange={e => set("key", e.target.value)}>
            {KEYS.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="editor-field">
          <label>Chords & Lyrics <span className="label-hint">(chord line then lyric line)</span></label>
          <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={10}
            placeholder={"G           D           Em\nThis is a lyric line below chords\nG           C\nAnother line here"} />
        </div>
        <div className="editor-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Save Song</button>
        </div>
      </div>
    </div>
  );
}

export default function SetlistPage({ songs, setSongs, setlist, setSetlist }) {
  const [activeSong, setActiveSong] = useState(setlist[0] || null);
  const [useFlats, setUseFlats] = useState(false);
  const [nashville, setNashville] = useState(false);
  const [displayMode, setDisplayMode] = useState("both");
  const [editing, setEditing] = useState(null);
  const [sideView, setSideView] = useState("setlist");
  const [mobileView, setMobileView] = useState("list");
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const currentSong = songs.find(s => s.id === activeSong);
  const setlistSongs = setlist.map(id => songs.find(s => s.id === id)).filter(Boolean);

  // Per-song transpose: update semitones on the song object itself
  const adjustSongSemitone = (delta) => {
    if (!activeSong) return;
    setSongs(ss => ss.map(s => s.id === activeSong
      ? { ...s, semitones: (s.semitones || 0) + delta }
      : s
    ));
  };
  const resetSongSemitone = () => {
    if (!activeSong) return;
    setSongs(ss => ss.map(s => s.id === activeSong ? { ...s, semitones: 0 } : s));
  };

  const currentSemitones = currentSong?.semitones || 0;

  const saveSong = (form) => {
    if (form.id) {
      setSongs(ss => ss.map(s => s.id === form.id ? form : s));
    } else {
      const newId = Date.now();
      setSongs(ss => [...ss, { ...form, id: newId, semitones: 0 }]);
    }
    setEditing(null);
  };

  const deleteSong = (id) => {
    setSongs(ss => ss.filter(s => s.id !== id));
    setSetlist(sl => sl.filter(sid => sid !== id));
    if (activeSong === id) setActiveSong(null);
  };

  const toggleSetlist = (id) => {
    setSetlist(sl => sl.includes(id) ? sl.filter(s => s !== id) : [...sl, id]);
  };

  const handleDrop = (targetId) => {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    setSetlist(sl => {
      const from = sl.indexOf(dragging), to = sl.indexOf(targetId);
      const next = [...sl]; next.splice(from, 1); next.splice(to, 0, dragging);
      return next;
    });
    setDragging(null); setDragOver(null);
  };

  const selectSong = (id) => {
    setActiveSong(id);
    setMobileView("song");
  };

  const SongList = ({ mobile = false }) => (
    <>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${sideView==="setlist"?"active":""}`} onClick={() => setSideView("setlist")}>
          Setlist ({setlist.length})
        </button>
        <button className={`sidebar-tab ${sideView==="library"?"active":""}`} onClick={() => setSideView("library")}>
          Library ({songs.length})
        </button>
      </div>
      <div className="sidebar-list">
        {sideView === "setlist" && setlistSongs.map((song, i) => (
          <div key={song.id}
            className={`song-row ${activeSong===song.id?"active":""} ${!mobile && dragOver===song.id?"drag-over":""}`}
            onClick={() => mobile ? selectSong(song.id) : setActiveSong(song.id)}
            draggable={!mobile}
            onDragStart={() => !mobile && setDragging(song.id)}
            onDragOver={e => { e.preventDefault(); !mobile && setDragOver(song.id); }}
            onDrop={() => !mobile && handleDrop(song.id)}
            onDragEnd={() => { setDragging(null); setDragOver(null); }}>
            {!mobile && <span className="drag-handle">⠿</span>}
            <span className="song-row-num">{i+1}</span>
            <div className="song-row-info">
              <div className="song-row-title">{song.title}</div>
              <div className="song-row-meta">{song.artist}</div>
            </div>
            <span className="song-row-key">
              {song.key}{song.semitones ? ` ${song.semitones > 0 ? "+" : ""}${song.semitones}` : ""}
            </span>
            <div className="song-row-actions" style={mobile?{opacity:1}:{}}>
              <button className="row-btn" onClick={e => { e.stopPropagation(); setEditing(song); }}>✏️</button>
              <button className="row-btn remove" onClick={e => { e.stopPropagation(); toggleSetlist(song.id); }}>✕</button>
            </div>
          </div>
        ))}
        {sideView === "setlist" && setlistSongs.length === 0 && (
          <div className="empty-sidebar">No songs in setlist.<br/>Go to Library to add some.</div>
        )}
        {sideView === "library" && songs.map(song => {
          const inSetlist = setlist.includes(song.id);
          return (
            <div key={song.id} className={`song-row ${activeSong===song.id?"active":""}`}
              onClick={() => mobile ? selectSong(song.id) : setActiveSong(song.id)}>
              <div className="song-row-info">
                <div className="song-row-title">{song.title}</div>
                <div className="song-row-meta">{song.artist}</div>
              </div>
              <span className="song-row-key">{song.key}</span>
              <div className="song-row-actions" style={mobile?{opacity:1}:{}}>
                <button className="row-btn" onClick={e => { e.stopPropagation(); setEditing(song); }}>✏️</button>
                <button className={`row-btn ${inSetlist?"remove":"add"}`}
                  onClick={e => { e.stopPropagation(); toggleSetlist(song.id); if (!inSetlist && !mobile) setSideView("setlist"); }}>
                  {inSetlist ? "✕" : "+"}
                </button>
                <button className="row-btn danger" onClick={e => { e.stopPropagation(); deleteSong(song.id); }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button className="btn-full" onClick={() => setEditing({ id: null, title: "", artist: "", key: "G", content: "", semitones: 0 })}>
          + Add Song
        </button>
      </div>
    </>
  );

  // Controls — 2 rows on mobile
  const Controls = () => (
    <div className="sl-controls">
      {/* Row 1: Transpose */}
      <div className="sl-ctrl-row">
        <span className="transpose-label">Transpose</span>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <button className="btn-icon" onClick={() => adjustSongSemitone(-1)}>♭</button>
          <span className="semitone-display">
            {currentSemitones > 0 ? `+${currentSemitones}` : currentSemitones}
          </span>
          <button className="btn-icon" onClick={() => adjustSongSemitone(1)}>♯</button>
          <button className="btn-icon" onClick={resetSongSemitone} style={{fontSize:"0.7rem"}} title="Reset this song">↺</button>
        </div>
        <span className="ctrl-song-name">{currentSong ? currentSong.title : "—"}</span>
        <div className="toggle-group">
          <button className={`toggle-btn ${!useFlats?"active":""}`} onClick={() => setUseFlats(false)}>♯</button>
          <button className={`toggle-btn ${useFlats?"active":""}`} onClick={() => setUseFlats(true)}>♭</button>
        </div>
      </div>
      {/* Row 2: Display toggles */}
      <div className="sl-ctrl-row">
        <div className="toggle-group">
          <button className={`toggle-btn ${!nashville?"active":""}`} onClick={() => setNashville(false)}>Standard</button>
          <button className={`toggle-btn ${nashville?"active":""}`} onClick={() => setNashville(true)}>Nashville</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${displayMode==="both"?"active":""}`} onClick={() => setDisplayMode("both")}>Both</button>
          <button className={`toggle-btn ${displayMode==="chords"?"active":""}`} onClick={() => setDisplayMode("chords")}>Chords</button>
          <button className={`toggle-btn ${displayMode==="lyrics"?"active":""}`} onClick={() => setDisplayMode("lyrics")}>Lyrics</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Controls />

      {/* Desktop */}
      <div className="page-body desktop-only">
        <aside className="sidebar">
          <SongList />
        </aside>
        <main className="main">
          {currentSong ? (
            <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎸</div>
              <div className="empty-text">No song selected</div>
              <div className="empty-sub">Pick a song from the sidebar</div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile */}
      <div className="mobile-only" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {mobileView === "list" ? (
          <SongList mobile />
        ) : (
          <>
            <div className="mobile-song-back">
              <button className="btn-ghost" style={{padding:"6px 14px",fontSize:"0.78rem"}} onClick={() => setMobileView("list")}>
                ← Back
              </button>
              {currentSong && (
                <span style={{fontWeight:700,fontSize:"0.88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {currentSong.title}
                </span>
              )}
              {currentSong && (
                <button className="row-btn" style={{opacity:1}} onClick={() => setEditing(currentSong)}>✏️</button>
              )}
            </div>
            <main className="main" style={{flex:1}}>
              {currentSong ? (
                <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎸</div>
                  <div className="empty-text">No song selected</div>
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {editing && <SongEditor song={editing} onSave={saveSong} onCancel={() => setEditing(null)} />}
    </>
  );
}
