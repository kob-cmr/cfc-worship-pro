import { useState, useRef, useEffect, useCallback } from "react";
import { KEYS, transposeNote, transposeChordLine, isChordLine } from "./shared.js";

function SongDisplay({ song, useFlats, nashville, displayMode }) {
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

// ── Fullscreen Performance View ───────────────────────────────────────────────
function FullscreenView({ setlistSongs, currentIndex, setCurrentIndex, useFlats, nashville, displayMode, onClose }) {
  const song = setlistSongs[currentIndex];
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const contentRef = useRef(null);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex, setCurrentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < setlistSongs.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, setlistSongs.length, setCurrentIndex]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, onClose]);

  // Swipe gesture
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (!song) return null;

  const semitones = song.semitones || 0;
  const rootForNashville = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootForNashville + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");

  const lines = song.content.split("\n").map((line, i) => {
    const chord = isChordLine(line);
    if (chord) {
      if (displayMode === "lyrics") return null;
      const t = transposeChordLine(line, semitones, useFlats, nashville, rootForNashville);
      return <div key={i} className="fs-chord-line">{t || "\u00A0"}</div>;
    }
    if (displayMode === "chords") return null;
    return <div key={i} className="fs-lyric-line">{line || "\u00A0"}</div>;
  });

  return (
    <div className="fs-overlay" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div className="fs-header">
        <button className="fs-close-btn" onClick={onClose}>✕ Exit</button>
        <div className="fs-song-info">
          <span className="fs-title">{song.title}</span>
          <span className="fs-artist">{song.artist}</span>
        </div>
        <div className="fs-key-badge">{nashville ? "NNS" : effectiveKey}</div>
        <span className="fs-counter">{currentIndex + 1} / {setlistSongs.length}</span>
      </div>

      {/* Song content */}
      <div className="fs-content" ref={contentRef}>
        <div className="fs-lines">{lines}</div>
      </div>

      {/* Bottom nav — big buttons for performance */}
      <div className="fs-nav">
        <button
          className="fs-nav-btn fs-prev"
          onClick={goPrev}
          disabled={currentIndex === 0}>
          <span className="fs-nav-arrow">‹</span>
          <span className="fs-nav-label">{currentIndex > 0 ? setlistSongs[currentIndex - 1].title : "—"}</span>
        </button>

        <div className="fs-dots">
          {setlistSongs.map((_, i) => (
            <button key={i}
              className={`fs-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)} />
          ))}
        </div>

        <button
          className="fs-nav-btn fs-next"
          onClick={goNext}
          disabled={currentIndex === setlistSongs.length - 1}>
          <span className="fs-nav-label">{currentIndex < setlistSongs.length - 1 ? setlistSongs[currentIndex + 1].title : "—"}</span>
          <span className="fs-nav-arrow">›</span>
        </button>
      </div>
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
            placeholder={"G           D           Em\nThis is a lyric line below chords"} />
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
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const currentSong = songs.find(s => s.id === activeSong);
  const setlistSongs = setlist.map(id => songs.find(s => s.id === id)).filter(Boolean);
  const currentSetlistIndex = setlistSongs.findIndex(s => s.id === activeSong);

  const adjustSongSemitone = (delta) => {
    if (!activeSong) return;
    setSongs(ss => ss.map(s => s.id === activeSong ? { ...s, semitones: (s.semitones || 0) + delta } : s));
  };
  const resetSongSemitone = () => {
    if (!activeSong) return;
    setSongs(ss => ss.map(s => s.id === activeSong ? { ...s, semitones: 0 } : s));
  };
  const currentSemitones = currentSong?.semitones || 0;

  const setCurrentIndexInSetlist = (idx) => {
    if (idx >= 0 && idx < setlistSongs.length) setActiveSong(setlistSongs[idx].id);
  };

  const saveSong = (form) => {
    if (form.id) {
      setSongs(ss => ss.map(s => s.id === form.id ? form : s));
    } else {
      setSongs(ss => [...ss, { ...form, id: Date.now(), semitones: 0 }]);
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

  const selectSong = (id) => { setActiveSong(id); setMobileView("song"); };

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
            className={`song-row ${activeSong===song.id?"active":""} ${!mobile&&dragOver===song.id?"drag-over":""}`}
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
              {song.key}{song.semitones ? ` ${song.semitones>0?"+":""}${song.semitones}` : ""}
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
          const inSL = setlist.includes(song.id);
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
                <button className={`row-btn ${inSL?"remove":"add"}`}
                  onClick={e => { e.stopPropagation(); toggleSetlist(song.id); }}>
                  {inSL ? "✕" : "+"}
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

  const Controls = () => (
    <div className="sl-controls">
      <div className="sl-ctrl-row">
        <span className="transpose-label">Transpose</span>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <button className="btn-icon" onClick={() => adjustSongSemitone(-1)}>♭</button>
          <span className="semitone-display">{currentSemitones > 0 ? `+${currentSemitones}` : currentSemitones}</span>
          <button className="btn-icon" onClick={() => adjustSongSemitone(1)}>♯</button>
          <button className="btn-icon" onClick={resetSongSemitone} style={{fontSize:"0.7rem"}}>↺</button>
        </div>
        <span className="ctrl-song-name">{currentSong ? currentSong.title : "—"}</span>
        <div className="toggle-group">
          <button className={`toggle-btn ${!useFlats?"active":""}`} onClick={() => setUseFlats(false)}>♯</button>
          <button className={`toggle-btn ${useFlats?"active":""}`} onClick={() => setUseFlats(true)}>♭</button>
        </div>
        {/* Fullscreen button — desktop */}
        {currentSong && setlistSongs.length > 0 && (
          <button className="btn-perform desktop-inline" onClick={() => setFullscreen(true)}
            title="Performance mode">
            ⛶ Perform
          </button>
        )}
      </div>
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
      <style>{`
        /* ── Fullscreen overlay ── */
        .fs-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: #0f0e0d;
          display: flex; flex-direction: column;
          touch-action: pan-y;
        }
        .fs-header {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; background: #1a1917;
          border-bottom: 1px solid #2e2b28; flex-shrink: 0;
          flex-wrap: wrap;
        }
        .fs-close-btn {
          padding: 8px 16px; background: #2e2b28; border: none; border-radius: 8px;
          color: #f0ebe3; font-size: 0.8rem; font-weight: 700; cursor: pointer;
          white-space: nowrap; transition: background .15s;
        }
        .fs-close-btn:hover { background: #E8621A; }
        .fs-song-info { flex: 1; min-width: 0; }
        .fs-title { display: block; font-family: 'Montserrat',sans-serif; font-size: 1rem; font-weight: 900; color: #f0ebe3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fs-artist { font-size: 0.72rem; color: #7a7268; }
        .fs-key-badge {
          font-family: 'Courier Prime', monospace; font-size: 0.9rem; font-weight: 700;
          color: #E8621A; background: rgba(232,98,26,0.12); border: 1px solid rgba(232,98,26,0.3);
          padding: 5px 12px; border-radius: 7px; white-space: nowrap;
        }
        .fs-counter { font-family: 'Courier Prime', monospace; font-size: 0.78rem; color: #7a7268; white-space: nowrap; }

        .fs-content {
          flex: 1; overflow-y: auto; padding: 24px 28px;
        }
        .fs-content::-webkit-scrollbar { width: 6px; }
        .fs-content::-webkit-scrollbar-thumb { background: #2e2b28; border-radius: 3px; }
        .fs-lines { max-width: 800px; }
        .fs-chord-line { font-family: 'Courier Prime', monospace; color: #E8621A; font-weight: 700; font-size: 1.15rem; white-space: pre; margin-bottom: 2px; line-height: 1.5; }
        .fs-lyric-line { font-family: 'Courier Prime', monospace; color: #d4ccbf; font-size: 1.15rem; white-space: pre; margin-bottom: 12px; line-height: 1.6; }

        /* ── Bottom nav ── */
        .fs-nav {
          display: flex; align-items: stretch; gap: 0;
          background: #1a1917; border-top: 1px solid #2e2b28;
          flex-shrink: 0; min-height: 80px;
        }
        .fs-nav-btn {
          flex: 1; display: flex; align-items: center; gap: 10px;
          padding: 14px 18px; border: none; background: transparent;
          color: #f0ebe3; cursor: pointer; transition: background .15s;
          min-height: 80px;
        }
        .fs-nav-btn:disabled { opacity: 0.25; cursor: default; }
        .fs-nav-btn:not(:disabled):hover { background: rgba(232,98,26,0.1); }
        .fs-prev { justify-content: flex-start; border-right: 1px solid #2e2b28; }
        .fs-next { justify-content: flex-end; }
        .fs-nav-arrow {
          font-size: 2.5rem; font-weight: 300; line-height: 1;
          color: #E8621A; flex-shrink: 0;
        }
        .fs-nav-label {
          font-size: 0.78rem; font-weight: 700; color: #7a7268;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 140px;
        }
        .fs-prev .fs-nav-label { text-align: left; }
        .fs-next .fs-nav-label { text-align: right; }
        .fs-dots {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 0 12px; flex-shrink: 0; flex-wrap: wrap;
          max-width: 200px;
        }
        .fs-dot {
          width: 8px; height: 8px; border-radius: 50%; border: none;
          background: #2e2b28; cursor: pointer; transition: all .15s; padding: 0;
        }
        .fs-dot.active { background: #E8621A; transform: scale(1.3); }

        /* Perform button */
        .btn-perform {
          padding: 7px 14px; background: #E8621A; color: white;
          border: none; border-radius: 8px; font-size: 0.72rem; font-weight: 700;
          cursor: pointer; white-space: nowrap; transition: background .15s;
          box-shadow: 0 2px 8px rgba(232,98,26,0.3);
        }
        .btn-perform:hover { background: #FF7A30; }
        .desktop-inline { display: inline-flex; }

        /* Mobile enlarged touch targets */
        @media (max-width: 900px) {
          .sidebar-tab { padding: 14px 8px !important; font-size: 0.72rem !important; }
          .song-row { padding: 12px 10px !important; min-height: 56px; }
          .song-row-title { font-size: 0.9rem !important; }
          .song-row-meta { font-size: 0.72rem !important; }
          .rbtn, .row-btn { width: 34px !important; height: 34px !important; font-size: 0.9rem !important; }
          .btn-full { padding: 14px !important; font-size: 0.8rem !important; }
          .toggle-btn { padding: 8px 12px !important; font-size: 0.7rem !important; }
          .btn-icon { width: 36px !important; height: 36px !important; font-size: 1rem !important; }
          .semitone-display { font-size: 1rem !important; min-width: 36px !important; }
          .sl-ctrl-row { padding: 10px 14px !important; gap: 10px !important; }
          .pill-btn { padding: 8px 14px !important; font-size: 0.72rem !important; }
          .icon-btn { width: 36px !important; height: 36px !important; font-size: 0.9rem !important; }
          .prog-select, .prog-input { padding: 10px 12px !important; font-size: 0.85rem !important; }
          .pitem { padding: 14px !important; }
        }

        @media (max-width: 640px) {
          .fs-chord-line, .fs-lyric-line { font-size: 1rem; }
          .fs-nav { min-height: 72px; }
          .fs-nav-btn { min-height: 72px; padding: 12px 14px; }
          .fs-nav-arrow { font-size: 2rem; }
          .fs-nav-label { font-size: 0.7rem; max-width: 90px; }
          .fs-header { padding: 10px 14px; gap: 8px; }
          .fs-content { padding: 16px; }
          .desktop-inline { display: none !important; }
        }
      `}</style>

      <Controls />

      {/* Fullscreen mode */}
      {fullscreen && (
        <FullscreenView
          setlistSongs={setlistSongs}
          currentIndex={currentSetlistIndex >= 0 ? currentSetlistIndex : 0}
          setCurrentIndex={(idx) => { setCurrentIndexInSetlist(idx); }}
          useFlats={useFlats}
          nashville={nashville}
          displayMode={displayMode}
          onClose={() => setFullscreen(false)}
        />
      )}

      {/* Desktop layout */}
      <div className="page-body desktop-only">
        <aside className="sidebar"><SongList /></aside>
        <main className="main">
          {currentSong ? (
            <>
              <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
              {/* Desktop prev/next at bottom of song */}
              {setlistSongs.length > 1 && (
                <div className="desktop-song-nav">
                  <button className="dsn-btn"
                    disabled={currentSetlistIndex <= 0}
                    onClick={() => setCurrentIndexInSetlist(currentSetlistIndex - 1)}>
                    ‹ {currentSetlistIndex > 0 ? setlistSongs[currentSetlistIndex - 1].title : ""}
                  </button>
                  <button className="btn-perform" onClick={() => setFullscreen(true)}>⛶ Performance Mode</button>
                  <button className="dsn-btn"
                    disabled={currentSetlistIndex >= setlistSongs.length - 1}
                    onClick={() => setCurrentIndexInSetlist(currentSetlistIndex + 1)}>
                    {currentSetlistIndex < setlistSongs.length - 1 ? setlistSongs[currentSetlistIndex + 1].title : ""} ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎸</div>
              <div className="empty-text">No song selected</div>
              <div className="empty-sub">Pick a song from the sidebar</div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="mobile-only" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {mobileView === "list" ? (
          <SongList mobile />
        ) : (
          <>
            <div className="mobile-song-back">
              <button className="btn-ghost" style={{padding:"8px 14px",fontSize:"0.8rem"}}
                onClick={() => setMobileView("list")}>← Back</button>
              {currentSong && (
                <span style={{fontWeight:700,fontSize:"0.88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {currentSong.title}
                </span>
              )}
              {currentSong && setlistSongs.length > 0 && (
                <button className="btn-perform" style={{fontSize:"0.7rem",padding:"7px 12px"}}
                  onClick={() => setFullscreen(true)}>⛶</button>
              )}
              {currentSong && (
                <button className="row-btn" style={{opacity:1,width:"34px",height:"34px"}}
                  onClick={() => setEditing(currentSong)}>✏️</button>
              )}
            </div>
            <main className="main" style={{flex:1,paddingBottom:"80px"}}>
              {currentSong ? (
                <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎸</div>
                  <div className="empty-text">No song selected</div>
                </div>
              )}
            </main>
            {/* Mobile prev/next fixed at bottom */}
            {setlistSongs.length > 1 && (
              <div className="mobile-song-nav">
                <button className="msn-btn"
                  disabled={currentSetlistIndex <= 0}
                  onClick={() => { setCurrentIndexInSetlist(currentSetlistIndex - 1); }}>
                  <span className="msn-arrow">‹</span>
                  <span className="msn-label">{currentSetlistIndex > 0 ? setlistSongs[currentSetlistIndex - 1].title : "—"}</span>
                </button>
                <span className="msn-counter">{currentSetlistIndex + 1}/{setlistSongs.length}</span>
                <button className="msn-btn msn-right"
                  disabled={currentSetlistIndex >= setlistSongs.length - 1}
                  onClick={() => { setCurrentIndexInSetlist(currentSetlistIndex + 1); }}>
                  <span className="msn-label">{currentSetlistIndex < setlistSongs.length - 1 ? setlistSongs[currentSetlistIndex + 1].title : "—"}</span>
                  <span className="msn-arrow">›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .desktop-song-nav {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 32px; padding-top: 20px; border-top: 2px solid var(--border);
          gap: 12px;
        }
        .dsn-btn {
          flex: 1; padding: 12px 16px; background: white;
          border: 1.5px solid var(--border); border-radius: 10px;
          color: var(--text); font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
          box-shadow: var(--shadow-sm); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .dsn-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); box-shadow: var(--shadow-md); }
        .dsn-btn:disabled { opacity: 0.3; cursor: default; }

        .mobile-song-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          display: flex; align-items: stretch;
          background: white; border-top: 2px solid var(--border);
          box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
          min-height: 70px; z-index: 50;
        }
        .msn-btn {
          flex: 1; display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border: none; background: transparent;
          color: var(--text); cursor: pointer; transition: background .15s;
        }
        .msn-btn:disabled { opacity: 0.25; cursor: default; }
        .msn-btn:not(:disabled):hover { background: var(--accent-light); }
        .msn-right { justify-content: flex-end; border-left: 1px solid var(--border); }
        .msn-arrow { font-size: 2rem; color: var(--accent); font-weight: 300; line-height: 1; flex-shrink: 0; }
        .msn-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .msn-counter { font-family: 'Courier Prime',monospace; font-size: 0.75rem; color: var(--muted); padding: 0 10px; display: flex; align-items: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); white-space: nowrap; }
      `}</style>

      {editing && <SongEditor song={editing} onSave={saveSong} onCancel={() => setEditing(null)} />}
    </>
  );
}
