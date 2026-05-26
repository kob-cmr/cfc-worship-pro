import { useState, useRef, useEffect, useCallback } from "react";
import { KEYS, transposeNote, transposeChordLine, isChordLine } from "./shared.js";

// displayMode: "lyrics" | "chords" | "drums"
// Key badge always shows the transposed letter key (never NNS)

function SongDisplay({ song, useFlats, nashville, displayMode }) {
  const semitones = song.semitones || 0;
  const rootKey = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootKey + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");

  // Chords mode: show chords + lyrics interleaved (standard chord chart)
  const renderChords = () =>
    (song.chords || "").split("\n").map((line, i) => {
      if (isChordLine(line)) {
        const t = transposeChordLine(line, semitones, useFlats, nashville, rootKey);
        return <div key={i} className="chord-line">{t || "\u00A0"}</div>;
      }
      return <div key={i} className="lyric-line">{line || "\u00A0"}</div>;
    });

  // Lyrics mode: plain lyrics only
  const renderLyrics = () =>
    (song.lyrics || "").split("\n").map((line, i) =>
      <div key={i} className="lyric-line">{line || "\u00A0"}</div>
    );

  // Drums mode: drum notes
  const renderDrums = () =>
    (song.drums || "").split("\n").map((line, i) =>
      <div key={i} className="drum-line">{line || "\u00A0"}</div>
    );

  return (
    <div className="song-display">
      <div className="song-display-header">
        <div>
          <div className="song-display-title">{song.title}</div>
          <div className="song-display-artist">{song.artist}</div>
        </div>
        {/* Key badge always shows letter, not NNS */}
        <div className="key-badge" title={nashville ? `Nashville mode · Key of ${effectiveKey}` : ""}>
          {effectiveKey}
          {nashville && <span style={{display:"block",fontSize:"0.6rem",opacity:0.7,marginTop:1}}>NNS</span>}
        </div>
      </div>
      <div className="song-content">
        {displayMode === "chords" && renderChords()}
        {displayMode === "lyrics" && renderLyrics()}
        {displayMode === "drums" && renderDrums()}
      </div>
    </div>
  );
}

// ── Song Editor with tabbed input ─────────────────────────────────────────────
function SongEditor({ song, onSave, onCancel }) {
  const [form, setForm] = useState({
    lyrics: "", chords: "", drums: "", ...song
  });
  const [editorTab, setEditorTab] = useState("lyrics");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const editorTabs = [
    { id:"lyrics", label:"🎤 Lyrics", placeholder:"Type or paste the lyrics here...\n\nVerse 1\nAmazing grace how sweet the sound\nThat saved a wretch like me\n\nChorus\nI once was lost but now am found\nWas blind but now I see" },
    { id:"chords", label:"🎸 Chords", placeholder:"Type chord lines above lyric lines:\n\nG           G7          C\nAmazing grace how sweet the sound\nG              Em       D\nThat saved a wretch like me" },
    { id:"drums", label:"🥁 Drum Notes", placeholder:"Type drum patterns or notes here:\n\nIntro: 4/4 straight\nVerse: Hi-hat on 8ths, kick on 1 & 3\nChorus: Open hi-hat on 2 & 4\nOutro: Ride cymbal, build to crash" },
  ];

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
        <div className="editor-field" style={{maxWidth:180}}>
          <label>Original Key</label>
          <select value={form.key} onChange={e => set("key", e.target.value)}>
            {KEYS.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>

        {/* Tabbed content input */}
        <div className="editor-tabs">
          {editorTabs.map(t => (
            <button key={t.id}
              className={`editor-tab-btn ${editorTab===t.id?"active":""}`}
              onClick={() => setEditorTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {editorTabs.map(t => editorTab === t.id && (
          <div key={t.id} className="editor-field" style={{marginBottom:0}}>
            <textarea
              value={form[t.id] || ""}
              onChange={e => set(t.id, e.target.value)}
              rows={11}
              placeholder={t.placeholder}
            />
          </div>
        ))}

        <div className="editor-actions" style={{marginTop:12}}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Save Song</button>
        </div>
      </div>
    </div>
  );
}

// ── Fullscreen Performance View ───────────────────────────────────────────────
function FullscreenView({ setlistSongs, currentIndex, setCurrentIndex, useFlats, nashville, displayMode, onClose }) {
  const song = setlistSongs[currentIndex];
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [zoom, setZoom] = useState(1.1);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex, setCurrentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < setlistSongs.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, setlistSongs.length, setCurrentIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.1, 2.5));
      if (e.key === "-") setZoom(z => Math.max(z - 0.1, 0.6));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, onClose]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (!song) return null;

  const semitones = song.semitones || 0;
  const rootKey = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootKey + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");

  const renderLines = () => {
    if (displayMode === "drums") {
      return (song.drums || "No drum notes added.").split("\n").map((line, i) =>
        <div key={i} className="fs-drum-line" style={{fontSize:`${zoom}rem`}}>{line || "\u00A0"}</div>
      );
    }
    if (displayMode === "lyrics") {
      return (song.lyrics || "No lyrics added.").split("\n").map((line, i) =>
        <div key={i} className="fs-lyric-line" style={{fontSize:`${zoom}rem`}}>{line || "\u00A0"}</div>
      );
    }
    // chords
    return (song.chords || "No chords added.").split("\n").map((line, i) => {
      if (isChordLine(line)) {
        const t = transposeChordLine(line, semitones, useFlats, nashville, rootKey);
        return <div key={i} className="fs-chord-line" style={{fontSize:`${zoom}rem`}}>{t || "\u00A0"}</div>;
      }
      return <div key={i} className="fs-lyric-line" style={{fontSize:`${zoom}rem`}}>{line || "\u00A0"}</div>;
    });
  };

  return (
    <div className="fs-overlay">
      {/* Header */}
      <div className="fs-header">
        <button className="fs-close-btn" onClick={onClose}>✕</button>
        <div className="fs-song-info">
          <span className="fs-title">{song.title}</span>
          <span className="fs-artist">{song.artist}</span>
        </div>
        {/* Key always shows letter */}
        <div className="fs-key-badge">{effectiveKey}</div>
        <span className="fs-counter">{currentIndex + 1}/{setlistSongs.length}</span>
      </div>

      {/* Zoom bar */}
      <div className="fs-zoom-bar">
        <span className="fs-zoom-label">Zoom</span>
        <button className="fs-zoom-btn" onClick={() => setZoom(z => Math.max(z-0.15, 0.6))}>A−</button>
        <span className="fs-zoom-val">{Math.round(zoom*100)}%</span>
        <button className="fs-zoom-btn" onClick={() => setZoom(z => Math.min(z+0.15, 2.5))}>A+</button>
        <button className="fs-zoom-btn" onClick={() => setZoom(1.1)}>↺</button>
      </div>

      {/* Content — swipe area */}
      <div className="fs-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        <div className="fs-lines">{renderLines()}</div>
      </div>

      {/* Bottom nav */}
      <div className="fs-nav">
        <button className="fs-nav-btn fs-prev" onClick={goPrev} disabled={currentIndex === 0}>
          <span className="fs-nav-arrow">‹</span>
          <span className="fs-nav-label">{currentIndex > 0 ? setlistSongs[currentIndex-1].title : "—"}</span>
        </button>
        <div className="fs-dots">
          {setlistSongs.map((_, i) => (
            <button key={i} className={`fs-dot ${i===currentIndex?"active":""}`} onClick={() => setCurrentIndex(i)} />
          ))}
        </div>
        <button className="fs-nav-btn fs-next" onClick={goNext} disabled={currentIndex === setlistSongs.length-1}>
          <span className="fs-nav-label">{currentIndex < setlistSongs.length-1 ? setlistSongs[currentIndex+1].title : "—"}</span>
          <span className="fs-nav-arrow">›</span>
        </button>
      </div>
    </div>
  );
}

// ── Main SetlistPage ───────────────────────────────────────────────────────────
export default function SetlistPage({ songs, setSongs, setlist, setSetlist }) {
  const [activeSong, setActiveSong] = useState(setlist[0] || null);
  const [useFlats, setUseFlats] = useState(false);
  const [nashville, setNashville] = useState(false);
  const [displayMode, setDisplayMode] = useState("chords"); // "lyrics" | "chords" | "drums"
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
    setSongs(ss => ss.map(s => s.id === activeSong ? { ...s, semitones: (s.semitones||0)+delta } : s));
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
        <button className={`sidebar-tab ${sideView==="setlist"?"active":""}`} onClick={() => setSideView("setlist")}>Setlist ({setlist.length})</button>
        <button className={`sidebar-tab ${sideView==="library"?"active":""}`} onClick={() => setSideView("library")}>Library ({songs.length})</button>
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
              {(() => {
                const root = transposeNote(song.key.replace("m",""), song.semitones||0, useFlats);
                const k = root + (song.key.includes("m")&&!song.key.includes("maj")?"m":"");
                return k + (song.semitones ? ` ${song.semitones>0?"+":""}${song.semitones}` : "");
              })()}
            </span>
            <div className="song-row-actions" style={mobile?{opacity:1}:{}}>
              <button className="row-btn" onClick={e => { e.stopPropagation(); setEditing(song); }}>✏️</button>
              <button className="row-btn remove" onClick={e => { e.stopPropagation(); toggleSetlist(song.id); }}>✕</button>
            </div>
          </div>
        ))}
        {sideView === "setlist" && setlistSongs.length === 0 && <div className="empty-sidebar">No songs in setlist.<br/>Go to Library to add.</div>}
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
                <button className={`row-btn ${inSL?"remove":"add"}`} onClick={e => { e.stopPropagation(); toggleSetlist(song.id); }}>{inSL?"✕":"+"}</button>
                <button className="row-btn danger" onClick={e => { e.stopPropagation(); deleteSong(song.id); }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button className="btn-full" onClick={() => setEditing({ id:null, title:"", artist:"", key:"G", lyrics:"", chords:"", drums:"", semitones:0 })}>
          + Add Song
        </button>
      </div>
    </>
  );

  const Controls = () => (
    <div className="sl-controls">
      {/* Row 1: Transpose */}
      <div className="sl-ctrl-row">
        <span className="transpose-label">Transpose</span>
        <button className="btn-icon" onClick={() => adjustSongSemitone(-1)}>♭</button>
        <span className="semitone-display">{currentSemitones>0?`+${currentSemitones}`:currentSemitones}</span>
        <button className="btn-icon" onClick={() => adjustSongSemitone(1)}>♯</button>
        <button className="btn-icon" onClick={resetSongSemitone} style={{fontSize:"0.7rem"}}>↺</button>
        <span className="ctrl-song-name">{currentSong ? currentSong.title : "—"}</span>
        <div className="toggle-group">
          <button className={`toggle-btn ${!useFlats?"active":""}`} onClick={() => setUseFlats(false)}>♯</button>
          <button className={`toggle-btn ${useFlats?"active":""}`} onClick={() => setUseFlats(true)}>♭</button>
        </div>
        {currentSong && setlistSongs.length > 0 && (
          <button className="btn-perform" onClick={() => setFullscreen(true)}>⛶</button>
        )}
      </div>
      {/* Row 2: Mode toggles */}
      <div className="sl-ctrl-row">
        <div className="toggle-group">
          <button className={`toggle-btn ${!nashville?"active":""}`} onClick={() => setNashville(false)}>Std</button>
          <button className={`toggle-btn ${nashville?"active":""}`} onClick={() => setNashville(true)}>NNS</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${displayMode==="lyrics"?"active":""}`} onClick={() => setDisplayMode("lyrics")}>🎤 Lyrics</button>
          <button className={`toggle-btn ${displayMode==="chords"?"active":""}`} onClick={() => setDisplayMode("chords")}>🎸 Chords</button>
          <button className={`toggle-btn ${displayMode==="drums"?"active":""}`} onClick={() => setDisplayMode("drums")}>🥁 Drums</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .drum-line { font-family: 'Courier Prime', monospace; color: #2563EB; white-space: pre-wrap; word-break: break-word; margin-bottom: 6px; line-height: 1.6; }
        .fs-drum-line { font-family: 'Courier Prime', monospace; color: #60A5FA; white-space: pre-wrap; word-break: break-word; margin-bottom: 8px; line-height: 1.6; }
        .fs-zoom-btn { padding: 4px 10px; background: #2e2b28; border: none; border-radius: 6px; color: #f0ebe3; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: background .15s; min-height: 32px; }
        .fs-zoom-btn:hover { background: #E8621A; }
        .editor-tabs { display: flex; gap: 3px; padding: 3px; background: var(--bg); border-radius: 10px; margin-bottom: 10px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); }
        .editor-tab-btn { flex: 1; padding: 9px 6px; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700; cursor: pointer; background: transparent; color: var(--muted); transition: all .15s; white-space: nowrap; }
        .editor-tab-btn:hover { color: var(--accent); }
        .editor-tab-btn.active { background: white; color: var(--accent); box-shadow: var(--shadow-sm); }
        .desktop-song-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding-top: 18px; border-top: 2px solid var(--border); gap: 12px; }
        .dsn-btn { flex: 1; padding: 12px 16px; background: white; border: 1.5px solid var(--border); border-radius: 10px; color: var(--text); font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dsn-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .dsn-btn:disabled { opacity: .3; cursor: default; }
        .mobile-song-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: stretch; background: white; border-top: 2px solid var(--border); box-shadow: 0 -4px 16px rgba(0,0,0,0.1); min-height: 70px; z-index: 50; }
        .msn-btn { flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: none; background: transparent; color: var(--text); cursor: pointer; transition: background .15s; }
        .msn-btn:disabled { opacity: .25; cursor: default; }
        .msn-btn:not(:disabled):hover { background: var(--accent-light); }
        .msn-right { justify-content: flex-end; border-left: 1px solid var(--border); }
        .msn-arrow { font-size: 2.2rem; color: var(--accent); font-weight: 300; line-height: 1; flex-shrink: 0; }
        .msn-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .msn-counter { font-family: 'Courier Prime',monospace; font-size: 0.75rem; color: var(--muted); padding: 0 10px; display: flex; align-items: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); white-space: nowrap; }
        @media (max-width: 900px) {
          .toggle-btn { padding: 9px 13px !important; font-size: 0.72rem !important; min-height: 40px !important; }
          .btn-icon { width: 40px !important; height: 40px !important; font-size: 1rem !important; }
          .semitone-display { font-size: 1rem !important; }
          .sl-ctrl-row { padding: 10px 12px !important; gap: 8px !important; }
          .song-row { min-height: 58px !important; padding: 12px 10px !important; }
          .row-btn { width: 36px !important; height: 36px !important; font-size: 0.9rem !important; }
          .btn-full { padding: 14px !important; font-size: 0.82rem !important; }
          .sidebar-tab { padding: 14px 8px !important; font-size: 0.73rem !important; min-height: 52px !important; }
          .editor-tab-btn { padding: 11px 6px !important; font-size: 0.75rem !important; }
        }
      `}</style>

      <Controls />

      {fullscreen && (
        <FullscreenView
          setlistSongs={setlistSongs}
          currentIndex={currentSetlistIndex >= 0 ? currentSetlistIndex : 0}
          setCurrentIndex={setCurrentIndexInSetlist}
          useFlats={useFlats}
          nashville={nashville}
          displayMode={displayMode}
          onClose={() => setFullscreen(false)}
        />
      )}

      {/* Desktop */}
      <div className="page-body">
        <aside className="sidebar"><SongList /></aside>
        <main className="main">
          {currentSong ? (
            <>
              <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
              {setlistSongs.length > 1 && (
                <div className="desktop-song-nav">
                  <button className="dsn-btn" disabled={currentSetlistIndex<=0} onClick={() => setCurrentIndexInSetlist(currentSetlistIndex-1)}>
                    ‹ {currentSetlistIndex>0 ? setlistSongs[currentSetlistIndex-1].title : ""}
                  </button>
                  <button className="btn-perform" onClick={() => setFullscreen(true)}>⛶ Perform</button>
                  <button className="dsn-btn" disabled={currentSetlistIndex>=setlistSongs.length-1} onClick={() => setCurrentIndexInSetlist(currentSetlistIndex+1)}>
                    {currentSetlistIndex<setlistSongs.length-1 ? setlistSongs[currentSetlistIndex+1].title : ""} ›
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

      {/* Mobile */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",display: window.innerWidth < 768 ? "flex" : "none"}}>
        {mobileView === "list" ? (
          <SongList mobile />
        ) : (
          <>
            <div className="mobile-song-back">
              <button className="btn-ghost" style={{padding:"9px 14px",fontSize:"0.82rem"}} onClick={() => setMobileView("list")}>← Back</button>
              {currentSong && <span style={{fontWeight:700,fontSize:"0.88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentSong.title}</span>}
              {currentSong && setlistSongs.length > 0 && <button className="btn-perform" style={{fontSize:"0.75rem",padding:"8px 12px"}} onClick={() => setFullscreen(true)}>⛶</button>}
              {currentSong && <button className="row-btn" style={{opacity:1,width:"36px",height:"36px"}} onClick={() => setEditing(currentSong)}>✏️</button>}
            </div>
            <main className="main" style={{flex:1,paddingBottom:"80px"}}>
              {currentSong ? (
                <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode} />
              ) : (
                <div className="empty-state"><div className="empty-icon">🎸</div><div className="empty-text">No song selected</div></div>
              )}
            </main>
            {setlistSongs.length > 1 && (
              <div className="mobile-song-nav">
                <button className="msn-btn" disabled={currentSetlistIndex<=0} onClick={() => setCurrentIndexInSetlist(currentSetlistIndex-1)}>
                  <span className="msn-arrow">‹</span>
                  <span className="msn-label">{currentSetlistIndex>0 ? setlistSongs[currentSetlistIndex-1].title : "—"}</span>
                </button>
                <span className="msn-counter">{currentSetlistIndex+1}/{setlistSongs.length}</span>
                <button className="msn-btn msn-right" disabled={currentSetlistIndex>=setlistSongs.length-1} onClick={() => setCurrentIndexInSetlist(currentSetlistIndex+1)}>
                  <span className="msn-label">{currentSetlistIndex<setlistSongs.length-1 ? setlistSongs[currentSetlistIndex+1].title : "—"}</span>
                  <span className="msn-arrow">›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editing && <SongEditor song={editing} onSave={saveSong} onCancel={() => setEditing(null)} />}
    </>
  );
}
