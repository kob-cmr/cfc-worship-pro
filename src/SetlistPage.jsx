import { useState } from "react";
import { KEYS, transposeNote, transposeChordLine, isChordLine } from "./shared.js";

function SongDisplay({ song, semitones, useFlats, nashville, displayMode }) {
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
          <label>Chords & Lyrics <span className="label-hint">(alternate chord line / lyric line)</span></label>
          <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={12}
            placeholder={"G           D           Em\nThis is a chord line above lyrics\nG           C\nAnother verse here"} />
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
  const [semitones, setSemitones] = useState(0);
  const [useFlats, setUseFlats] = useState(false);
  const [nashville, setNashville] = useState(false);
  const [displayMode, setDisplayMode] = useState("both");
  const [editing, setEditing] = useState(null);
  const [sideView, setSideView] = useState("setlist");
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const currentSong = songs.find(s => s.id === activeSong);
  const setlistSongs = setlist.map(id => songs.find(s => s.id === id)).filter(Boolean);

  const saveSong = (form) => {
    if (form.id) {
      setSongs(ss => ss.map(s => s.id === form.id ? form : s));
    } else {
      const newId = Date.now();
      setSongs(ss => [...ss, { ...form, id: newId }]);
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

  return (
    <>
      <div className="page-header">
        <div className="transpose-bar">
          <span className="transpose-label">Transpose</span>
          <button className="btn-icon" onClick={() => setSemitones(s => s - 1)}>♭</button>
          <span className="semitone-display">{semitones > 0 ? `+${semitones}` : semitones}</span>
          <button className="btn-icon" onClick={() => setSemitones(s => s + 1)}>♯</button>
          <button className="btn-icon" onClick={() => setSemitones(0)} style={{fontSize:"0.7rem"}}>↺</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${!useFlats ? "active":""}`} onClick={() => setUseFlats(false)}>♯ Sharps</button>
          <button className={`toggle-btn ${useFlats ? "active":""}`} onClick={() => setUseFlats(true)}>♭ Flats</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${!nashville ? "active":""}`} onClick={() => setNashville(false)}>Standard</button>
          <button className={`toggle-btn ${nashville ? "active":""}`} onClick={() => setNashville(true)}>Nashville</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${displayMode==="both"?"active":""}`} onClick={() => setDisplayMode("both")}>Both</button>
          <button className={`toggle-btn ${displayMode==="chords"?"active":""}`} onClick={() => setDisplayMode("chords")}>Chords</button>
          <button className={`toggle-btn ${displayMode==="lyrics"?"active":""}`} onClick={() => setDisplayMode("lyrics")}>Lyrics</button>
        </div>
      </div>

      <div className="page-body">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button className={`sidebar-tab ${sideView==="setlist"?"active":""}`} onClick={() => setSideView("setlist")}>Setlist ({setlist.length})</button>
            <button className={`sidebar-tab ${sideView==="library"?"active":""}`} onClick={() => setSideView("library")}>Library ({songs.length})</button>
          </div>
          <div className="sidebar-list">
            {sideView === "setlist" && setlistSongs.map((song, i) => (
              <div key={song.id}
                className={`song-row ${activeSong===song.id?"active":""} ${dragOver===song.id?"drag-over":""}`}
                onClick={() => setActiveSong(song.id)} draggable
                onDragStart={() => setDragging(song.id)}
                onDragOver={e => { e.preventDefault(); setDragOver(song.id); }}
                onDrop={() => handleDrop(song.id)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}>
                <span className="drag-handle">⠿</span>
                <span className="song-row-num">{i+1}</span>
                <div className="song-row-info">
                  <div className="song-row-title">{song.title}</div>
                  <div className="song-row-meta">{song.artist}</div>
                </div>
                <span className="song-row-key">{song.key}</span>
                <div className="song-row-actions">
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
                <div key={song.id} className={`song-row ${activeSong===song.id?"active":""}`} onClick={() => setActiveSong(song.id)}>
                  <div className="song-row-info">
                    <div className="song-row-title">{song.title}</div>
                    <div className="song-row-meta">{song.artist}</div>
                  </div>
                  <span className="song-row-key">{song.key}</span>
                  <div className="song-row-actions">
                    <button className="row-btn" onClick={e => { e.stopPropagation(); setEditing(song); }}>✏️</button>
                    <button className={`row-btn ${inSetlist?"remove":"add"}`}
                      onClick={e => { e.stopPropagation(); toggleSetlist(song.id); if (!inSetlist) setSideView("setlist"); }}>
                      {inSetlist ? "✕" : "+"}
                    </button>
                    <button className="row-btn danger" onClick={e => { e.stopPropagation(); deleteSong(song.id); }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sidebar-footer">
            <button className="btn-full" onClick={() => setEditing({ id: null, title: "", artist: "", key: "G", content: "" })}>
              + Add Song
            </button>
          </div>
        </aside>

        <main className="main">
          {currentSong ? (
            <SongDisplay song={currentSong} semitones={semitones} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎸</div>
              <div className="empty-text">No song selected</div>
              <div className="empty-sub">Pick a song from the sidebar</div>
            </div>
          )}
        </main>
      </div>

      {editing && <SongEditor song={editing} onSave={saveSong} onCancel={() => setEditing(null)} />}
    </>
  );
}
