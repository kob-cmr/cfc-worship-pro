import { useState, useRef, useEffect, useCallback } from "react";
import { KEYS, transposeNote, transposeChordLine, isChordLine, nashvilleLineToStandard, isNashvilleLine } from "./shared.js";

// ── Section types available as buttons ───────────────────────────────────────
const SECTION_TYPES = ["Intro","Verse","Pre-Chorus","Refrain","Chorus","Bridge","Tag","Interlude","Outro"];
const TEMPO_SIGS = ["4/4","3/4","6/8","2/4","5/4","7/8","12/8"];

// Build a blank section object
function makeSection(type, number = null) {
  return {
    id: `sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    type,                          // e.g. "Verse"
    number,                        // e.g. 1, 2, null
    label: number ? `${type} ${number}` : type,
    visible: true,                 // toggled by arrangement
    lyrics: "",
    chords: "",
    drums: "",
  };
}

// Count how many sections of a given type exist already
function countOfType(sections, type) {
  return sections.filter(s => s.type === type).length;
}

// ── Transpose chord-only content (no lyric lines) ────────────────────────────
function transposeChordOnly(content, semitones, useFlats, nashville, rootKey) {
  return (content || "").split("\n").map(line => {
    if (!line.trim()) return "";
    if (isChordLine(line)) return transposeChordLine(line, semitones, useFlats, nashville, rootKey);
    return null; // skip lyric lines
  }).filter(l => l !== null).join("\n");
}

// ── Render sections for display ───────────────────────────────────────────────
function renderSections({ sections, displayMode, semitones, useFlats, nashville, rootKey, zoom, fsMode }) {
  const visible = sections.filter(s => s.visible !== false);
  return visible.map(sec => (
    <div key={sec.id} className={fsMode ? "fs-song-section" : "song-section"}>
      {/* Section label — bold, never transposed */}
      <div className={fsMode ? "fs-section-label" : "section-label"}
        style={zoom ? { fontSize: `${zoom * 0.82}rem` } : {}}>
        {sec.label}
      </div>

      {/* Content */}
      {displayMode === "lyrics" && (
        <div className={fsMode ? "fs-lyric-block" : "lyric-block"}>
          {(sec.lyrics || "—").split("\n").map((line, i) =>
            <div key={i} className={fsMode ? "fs-lyric-line" : "lyric-line"}
              style={zoom ? { fontSize: `${zoom}rem` } : {}}>{line || "\u00A0"}</div>
          )}
        </div>
      )}

      {displayMode === "chords" && (
        <div className={fsMode ? "fs-chord-block" : "chord-block"}>
          {(sec.chords || "").split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} style={{ height: "6px" }} />;
            // All non-empty lines in the chords field are chord lines — show everything
            const t = transposeChordLine(line, semitones, useFlats, nashville, rootKey);
            return (
              <div key={i} className={fsMode ? "fs-chord-line" : "chord-line"}
                style={zoom ? { fontSize: `${zoom}rem` } : {}}>
                {t || line}
              </div>
            );
          })}
        </div>
      )}

      {displayMode === "drums" && (
        <div className="drum-block">
          {(sec.drums || "—").split("\n").map((line, i) =>
            <div key={i} className={fsMode ? "fs-drum-line" : "drum-line"}
              style={zoom ? { fontSize: `${zoom}rem` } : {}}>{line || "\u00A0"}</div>
          )}
        </div>
      )}
    </div>
  ));
}

// ── Song Display ──────────────────────────────────────────────────────────────
function SongDisplay({ song, useFlats, nashville, displayMode }) {
  const semitones = song.semitones || 0;
  const rootKey = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootKey + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");
  const sections = song.sections || [];

  return (
    <div className="song-display">
      <div className="song-display-header">
        <div>
          <div className="song-display-title">{song.title}</div>
          <div className="song-display-artist">{song.artist}</div>
          {(song.bpm || song.tempoSig) && (
            <div className="song-meta-pills">
              {song.bpm && <span className="meta-pill">♩ {song.bpm} BPM</span>}
              {song.tempoSig && <span className="meta-pill">{song.tempoSig}</span>}
            </div>
          )}
        </div>
        <div className="key-badge">
          {effectiveKey}
          {nashville && <span style={{display:"block",fontSize:"0.6rem",opacity:0.7,marginTop:1}}>NNS</span>}
        </div>
      </div>
      <div className="song-content">
        {sections.length > 0
          ? renderSections({ sections, displayMode, semitones, useFlats, nashville, rootKey })
          : <div className="empty-sidebar" style={{padding:"20px 0"}}>No sections added yet. Edit the song to add sections.</div>
        }
      </div>
    </div>
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────
function SectionEditor({ section, onUpdate, onDelete, onMove, isFirst, isLast }) {
  const [tab, setTab] = useState("chords");
  const [expanded, setExpanded] = useState(false);
  const tabs = [
    { id:"chords", label:"🎸 Chords" },
    { id:"lyrics", label:"🎤 Lyrics" },
    { id:"drums",  label:"🥁 Drums" },
  ];
  return (
    <div className={`sec-editor-card ${expanded?"sec-editor-expanded":""}`}>
      <div className="sec-editor-header">
        <button className="sec-editor-label-btn" onClick={() => setExpanded(e => !e)}>
          <span className="sec-editor-label">{section.label}</span>
          <span style={{fontSize:"0.8rem",marginLeft:6,color:"var(--muted)"}}>{expanded?"▲":"▼"}</span>
        </button>
        <div className="sec-editor-actions">
          <button className="icon-btn" disabled={isFirst} onClick={() => onMove(-1)} title="Move up">↑</button>
          <button className="icon-btn" disabled={isLast}  onClick={() => onMove(1)}  title="Move down">↓</button>
          <button
            className={`sec-visible-btn ${section.visible===false?"hidden":""}`}
            onClick={() => onUpdate({ ...section, visible: section.visible===false ? true : false })}>
            {section.visible===false ? "👁 Off" : "👁 On"}
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(section.id)}>✕</button>
        </div>
      </div>
      {expanded && (
        <>
          <div className="sec-editor-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`sec-tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === "chords" && (
            <textarea className="sec-textarea"
              value={section.chords||""}
              onChange={e => onUpdate({...section, chords:e.target.value})}
              placeholder={"Chords only — no lyrics:\n\nG    D    Em   C\nG    D    G"}
              rows={6}/>
          )}
          {tab === "lyrics" && (
            <textarea className="sec-textarea"
              value={section.lyrics||""}
              onChange={e => onUpdate({...section, lyrics:e.target.value})}
              placeholder={"Lyrics for this section:\n\nAmazing grace how sweet the sound\nThat saved a wretch like me"}
              rows={6}/>
          )}
          {tab === "drums" && (
            <textarea className="sec-textarea"
              value={section.drums||""}
              onChange={e => onUpdate({...section, drums:e.target.value})}
              placeholder={"Drum notes:\n\nHi-hat 8ths, kick on 1 & 3, snare on 2 & 4"}
              rows={5}/>
          )}
        </>
      )}
    </div>
  );
}

// ── Song Editor ───────────────────────────────────────────────────────────────
function SongEditor({ song, onSave, onCancel }) {
  const [form, setForm] = useState({
    lyrics:"", chords:"", drums:"", sections:[], bpm:"", tempoSig:"4/4", ...song
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSection = (type) => {
    const existing = countOfType(form.sections, type);
    const num = existing > 0 ? existing + 1 : (["Intro","Outro","Bridge","Tag","Interlude"].includes(type) ? null : 1);
    const sec = makeSection(type, num);
    set("sections", [...form.sections, sec]);
  };

  const updateSection = (updated) => {
    set("sections", form.sections.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSection = (id) => {
    set("sections", form.sections.filter(s => s.id !== id));
  };

  const moveSection = (idx, dir) => {
    const arr = [...form.sections];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    set("sections", arr);
  };

  return (
    <div className="editor-overlay">
      <div className="editor-card" style={{maxWidth:680}}>
        <h2 className="editor-title">{song.id ? "Edit Song" : "New Song"}</h2>

        {/* Basic info */}
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

        {/* Key, BPM, Tempo */}
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"14px"}}>
          <div className="editor-field" style={{flex:"0 0 120px",marginBottom:0}}>
            <label>Original Key</label>
            <select value={form.key} onChange={e => set("key", e.target.value)}>
              {KEYS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="editor-field" style={{flex:"0 0 100px",marginBottom:0}}>
            <label>BPM</label>
            <input type="number" min="40" max="300" value={form.bpm||""} onChange={e => set("bpm", e.target.value)} placeholder="e.g. 120" />
          </div>
          <div className="editor-field" style={{flex:"0 0 110px",marginBottom:0}}>
            <label>Time Sig</label>
            <select value={form.tempoSig||"4/4"} onChange={e => set("tempoSig", e.target.value)}>
              {TEMPO_SIGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Section builder */}
        <div className="editor-field" style={{marginBottom:8}}>
          <label>Add Sections</label>
          <div className="section-btn-row">
            {SECTION_TYPES.map(type => (
              <button key={type} className="section-add-btn" onClick={() => addSection(type)}>
                + {type}
              </button>
            ))}
          </div>
        </div>

        {/* Arrangement builder */}
        {form.sections.length > 0 && (
          <div className="editor-field" style={{marginBottom:8}}>
            <label>Arrangement & Visibility <span className="label-hint">(👁 Visible / 👁 Hidden — hidden sections won't show in performance)</span></label>
            <div className="arrangement-pills">
              {form.sections.map((sec, i) => (
                <button key={sec.id}
                  className={`arr-pill ${sec.visible===false?"arr-pill-hidden":""}`}
                  onClick={() => updateSection({ ...sec, visible: sec.visible===false ? true : false })}>
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section cards */}
        <div className="sec-editor-list">
          {form.sections.map((sec, i) => (
            <SectionEditor key={sec.id} section={sec}
              onUpdate={updateSection}
              onDelete={deleteSection}
              onMove={(dir) => moveSection(i, dir)}
              isFirst={i===0} isLast={i===form.sections.length-1}/>
          ))}
          {form.sections.length === 0 && (
            <div style={{padding:"16px",textAlign:"center",color:"var(--muted)",fontSize:"0.82rem",background:"var(--bg)",borderRadius:"10px",border:"1.5px dashed var(--border)"}}>
              Tap the section buttons above to build your song structure
            </div>
          )}
        </div>

        <div className="editor-actions" style={{marginTop:14}}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            // Convert any NNS lines in each section's chords to standard
            const rootKey = form.key.replace("m","");
            const converted = {
              ...form,
              sections: (form.sections||[]).map(sec => ({
                ...sec,
                chords: (sec.chords||"").split("\n").map(line =>
                  isNashvilleLine(line) ? nashvilleLineToStandard(line, rootKey) : line
                ).join("\n")
              }))
            };
            onSave(converted);
          }}>Save Song</button>
        </div>
      </div>
    </div>
  );
}

// ── Fullscreen Performance View ───────────────────────────────────────────────
function FullscreenView({ setlistSongs, currentIndex, onIndexChange, useFlats, nashville, displayMode, onClose }) {
  const [zoom, setZoom] = useState(1.15);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const indexRef = useRef(currentIndex);
  const lengthRef = useRef(setlistSongs.length);
  indexRef.current = currentIndex;
  lengthRef.current = setlistSongs.length;

  const goPrev = useCallback(() => { if (indexRef.current > 0) onIndexChange(indexRef.current - 1); }, [onIndexChange]);
  const goNext = useCallback(() => { if (indexRef.current < lengthRef.current - 1) onIndexChange(indexRef.current + 1); }, [onIndexChange]);

  useEffect(() => {
    const h = (e) => {
      if (e.key==="ArrowRight"||e.key==="ArrowDown") goNext();
      if (e.key==="ArrowLeft"||e.key==="ArrowUp") goPrev();
      if (e.key==="Escape") onClose();
      if (e.key==="+"||e.key==="=") setZoom(z=>Math.min(z+0.15,2.5));
      if (e.key==="-") setZoom(z=>Math.max(z-0.15,0.6));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goPrev, goNext, onClose]);

  const onTouchStart = (e) => { touchStartX.current=e.touches[0].clientX; touchStartY.current=e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (touchStartX.current===null) return;
    const dx=e.changedTouches[0].clientX-touchStartX.current;
    const dy=e.changedTouches[0].clientY-touchStartY.current;
    if (Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50) { if(dx<0)goNext(); else goPrev(); }
    touchStartX.current=null;
  };

  const song = setlistSongs[currentIndex];
  if (!song) return null;

  const semitones = song.semitones || 0;
  const rootKey = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootKey + (song.key.includes("m")&&!song.key.includes("maj")?"m":"");
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < setlistSongs.length - 1;
  const sections = song.sections || [];

  return (
    <div className="fs-overlay">
      <div className="fs-header">
        <button className="fs-close-btn" onClick={onClose}>✕ Exit</button>
        <div className="fs-song-info">
          <span className="fs-title">{song.title}</span>
          <span className="fs-artist">{song.artist}{song.bpm ? ` · ♩${song.bpm}` : ""}{song.tempoSig ? ` · ${song.tempoSig}` : ""}</span>
        </div>
        <div className="fs-key-badge">{effectiveKey}{nashville&&<span style={{display:"block",fontSize:"0.6rem",opacity:0.7}}>NNS</span>}</div>
        <span className="fs-counter">{currentIndex+1}/{setlistSongs.length}</span>
      </div>

      <div className="fs-zoom-bar">
        <span className="fs-zoom-label">Size</span>
        <button className="fs-zoom-btn" onClick={()=>setZoom(z=>Math.max(z-0.15,0.6))}>A−</button>
        <span className="fs-zoom-val">{Math.round(zoom*100)}%</span>
        <button className="fs-zoom-btn" onClick={()=>setZoom(z=>Math.min(z+0.15,2.5))}>A+</button>
        <button className="fs-zoom-btn" onClick={()=>setZoom(1.15)}>↺</button>
      </div>

      <div className="fs-content" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="fs-lines">
          {sections.length > 0
            ? renderSections({ sections, displayMode, semitones, useFlats, nashville, rootKey, zoom, fsMode: true })
            : <div style={{color:"#64748B",fontSize:`${zoom}rem`}}>No sections added to this song.</div>
          }
        </div>
      </div>

      <div className="fs-nav">
        <button className="fs-nav-btn fs-prev" onClick={goPrev} disabled={!hasPrev}>
          <span className="fs-nav-arrow">‹</span>
          <span className="fs-nav-label">{hasPrev?setlistSongs[currentIndex-1].title:"—"}</span>
        </button>
        <div className="fs-dots">
          {setlistSongs.map((_,i)=>(
            <button key={i} className={`fs-dot ${i===currentIndex?"active":""}`} onClick={()=>onIndexChange(i)}/>
          ))}
        </div>
        <button className="fs-nav-btn fs-next" onClick={goNext} disabled={!hasNext}>
          <span className="fs-nav-label">{hasNext?setlistSongs[currentIndex+1].title:"—"}</span>
          <span className="fs-nav-arrow">›</span>
        </button>
      </div>
    </div>
  );
}

// ── Main SetlistPage ──────────────────────────────────────────────────────────
export default function SetlistPage({ songs, setSongs, programs }) {
  // Program selector — default to most recent
  const [selectedProgramId, setSelectedProgramId] = useState(
    programs.length > 0 ? programs[programs.length-1].id : null
  );
  const selectedProgram = programs.find(p => p.id === selectedProgramId) || programs[programs.length-1] || null;
  const setlist = selectedProgram
    ? selectedProgram.items.filter(i => i.type==="song" && i.songId).map(i => i.songId)
    : [];
  const setSetlist = () => {}; // setlist is derived from program, read-only here
  const [activeSong, setActiveSong] = useState(setlist[0]||null);
  const [useFlats, setUseFlats] = useState(false);
  const [nashville, setNashville] = useState(false);
  const [displayMode, setDisplayMode] = useState("chords");
  const [editing, setEditing] = useState(null);
  const [sideView, setSideView] = useState("setlist");
  const [mobileView, setMobileView] = useState("list");
  const [fsIndex, setFsIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const currentSong = songs.find(s=>s.id===activeSong);
  const setlistSongs = setlist.map(id=>songs.find(s=>s.id===id)).filter(Boolean);
  const currentSetlistIndex = setlistSongs.findIndex(s=>s.id===activeSong);

  const openFullscreen = () => {
    setFsIndex(currentSetlistIndex>=0?currentSetlistIndex:0);
    setFullscreen(true);
  };
  const handleFsIndexChange = (idx) => {
    setFsIndex(idx);
    if (idx>=0&&idx<setlistSongs.length) setActiveSong(setlistSongs[idx].id);
  };

  const adjustSongSemitone = (d) => {
    if (!activeSong) return;
    setSongs(ss=>ss.map(s=>s.id===activeSong?{...s,semitones:(s.semitones||0)+d}:s));
  };
  const resetSongSemitone = () => {
    if (!activeSong) return;
    setSongs(ss=>ss.map(s=>s.id===activeSong?{...s,semitones:0}:s));
  };
  const currentSemitones = currentSong?.semitones||0;
  const setCurrentIndexInSetlist = (idx) => {
    if (idx>=0&&idx<setlistSongs.length) setActiveSong(setlistSongs[idx].id);
  };

  const saveSong = (form) => {
    if (form.id) setSongs(ss=>ss.map(s=>s.id===form.id?form:s));
    else setSongs(ss=>[...ss,{...form,id:Date.now(),semitones:0}]);
    setEditing(null);
  };
  const deleteSong = (id) => {
    setSongs(ss=>ss.filter(s=>s.id!==id));
    setSetlist(sl=>sl.filter(sid=>sid!==id));
    if (activeSong===id) setActiveSong(null);
  };
  const toggleSetlist = (id) => {
    setSetlist(sl=>sl.includes(id)?sl.filter(s=>s!==id):[...sl,id]);
  };
  const handleDrop = (targetId) => {
    if (!dragging||dragging===targetId){setDragging(null);setDragOver(null);return;}
    setSetlist(sl=>{
      const from=sl.indexOf(dragging),to=sl.indexOf(targetId);
      const next=[...sl];next.splice(from,1);next.splice(to,0,dragging);return next;
    });
    setDragging(null);setDragOver(null);
  };
  const selectSong = (id)=>{setActiveSong(id);setMobileView("song");};

  const SongList = ({mobile=false})=>(
    <>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${sideView==="setlist"?"active":""}`} onClick={()=>setSideView("setlist")}>Setlist ({setlist.length})</button>
        <button className={`sidebar-tab ${sideView==="library"?"active":""}`} onClick={()=>setSideView("library")}>Library ({songs.length})</button>
      </div>
      <div className="sidebar-list">
        {sideView==="setlist"&&setlistSongs.map((song,i)=>(
          <div key={song.id}
            className={`song-row ${activeSong===song.id?"active":""} ${!mobile&&dragOver===song.id?"drag-over":""}`}
            onClick={()=>mobile?selectSong(song.id):setActiveSong(song.id)}
            draggable={!mobile}
            onDragStart={()=>!mobile&&setDragging(song.id)}
            onDragOver={e=>{e.preventDefault();!mobile&&setDragOver(song.id);}}
            onDrop={()=>!mobile&&handleDrop(song.id)}
            onDragEnd={()=>{setDragging(null);setDragOver(null);}}>
            {!mobile&&<span className="drag-handle">⠿</span>}
            <span className="song-row-num">{i+1}</span>
            <div className="song-row-info">
              <div className="song-row-title">{song.title}</div>
              <div className="song-row-meta">{song.artist}</div>
            </div>
            <span className="song-row-key">
              {(()=>{
                const root=transposeNote(song.key.replace("m",""),song.semitones||0,useFlats);
                const k=root+(song.key.includes("m")&&!song.key.includes("maj")?"m":"");
                return k+(song.semitones?` ${song.semitones>0?"+":""}${song.semitones}`:"");
              })()}
            </span>
            <div className="song-row-actions" style={mobile?{opacity:1}:{}}>
              <button className="row-btn" onClick={e=>{e.stopPropagation();setEditing(song);}}>✏️</button>
              <button className="row-btn remove" onClick={e=>{e.stopPropagation();toggleSetlist(song.id);}}>✕</button>
            </div>
          </div>
        ))}
        {sideView==="setlist"&&setlistSongs.length===0&&<div className="empty-sidebar">No songs in setlist.<br/>Go to Library to add.</div>}
        {sideView==="library"&&songs.map(song=>{
          const inSL=setlist.includes(song.id);
          return(
            <div key={song.id} className={`song-row ${activeSong===song.id?"active":""}`}
              onClick={()=>mobile?selectSong(song.id):setActiveSong(song.id)}>
              <div className="song-row-info">
                <div className="song-row-title">{song.title}</div>
                <div className="song-row-meta">{song.artist}</div>
              </div>
              <span className="song-row-key">{song.key}</span>
              <div className="song-row-actions" style={mobile?{opacity:1}:{}}>
                <button className="row-btn" onClick={e=>{e.stopPropagation();setEditing(song);}}>✏️</button>
                <button className={`row-btn ${inSL?"remove":"add"}`} onClick={e=>{e.stopPropagation();toggleSetlist(song.id);}}>{inSL?"✕":"+"}</button>
                <button className="row-btn danger" onClick={e=>{e.stopPropagation();deleteSong(song.id);}}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button className="btn-full" onClick={()=>setEditing({id:null,title:"",artist:"",key:"G",bpm:"",tempoSig:"4/4",sections:[],semitones:0})}>
          + Add Song
        </button>
      </div>
    </>
  );

  const Controls=()=>(
    <div className="sl-controls">
      {/* Program selector row */}
      {programs.length > 1 && (
        <div className="sl-ctrl-row" style={{background:"#EFF6FF",borderBottom:"1px solid #BFDBFE"}}>
          <span className="transpose-label" style={{color:"#2563EB"}}>Setlist from</span>
          <select
            value={selectedProgramId||""}
            onChange={e => setSelectedProgramId(e.target.value)}
            style={{flex:1,padding:"6px 10px",borderRadius:"8px",border:"1.5px solid #BFDBFE",background:"white",fontSize:".8rem",fontWeight:600,color:"#1D4ED8",outline:"none",cursor:"pointer"}}>
            {[...programs].reverse().map(p => (
              <option key={p.id} value={p.id}>{p.title} — {p.date}</option>
            ))}
          </select>
        </div>
      )}
      <div className="sl-ctrl-row">
        <span className="transpose-label">Transpose</span>
        <button className="btn-icon" onClick={()=>adjustSongSemitone(-1)}>♭</button>
        <span className="semitone-display">{currentSemitones>0?`+${currentSemitones}`:currentSemitones}</span>
        <button className="btn-icon" onClick={()=>adjustSongSemitone(1)}>♯</button>
        <button className="btn-icon" onClick={resetSongSemitone} style={{fontSize:"0.7rem"}}>↺</button>
        <span className="ctrl-song-name">{currentSong?currentSong.title:"—"}</span>
        <div className="toggle-group">
          <button className={`toggle-btn ${!useFlats?"active":""}`} onClick={()=>setUseFlats(false)}>♯</button>
          <button className={`toggle-btn ${useFlats?"active":""}`} onClick={()=>setUseFlats(true)}>♭</button>
        </div>
      </div>
      <div className="sl-ctrl-row">
        <div className="toggle-group">
          <button className={`toggle-btn ${!nashville?"active":""}`} onClick={()=>setNashville(false)}>Std</button>
          <button className={`toggle-btn ${nashville?"active":""}`} onClick={()=>setNashville(true)}>NNS</button>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${displayMode==="lyrics"?"active":""}`} onClick={()=>setDisplayMode("lyrics")}>🎤 Lyrics</button>
          <button className={`toggle-btn ${displayMode==="chords"?"active":""}`} onClick={()=>setDisplayMode("chords")}>🎸 Chords</button>
          <button className={`toggle-btn ${displayMode==="drums"?"active":""}`} onClick={()=>setDisplayMode("drums")}>🥁 Drums</button>
        </div>
        {currentSong&&setlistSongs.length>0&&(
          <button className="btn-perform" onClick={openFullscreen}>⛶ Perform</button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .song-section { margin-bottom: 20px; }
        .section-label { display: inline-block; font-weight: 800; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); padding: 3px 12px; border-radius: 20px; margin-bottom: 8px; border: 1px solid #BFDBFE; }
        .lyric-block,.chord-block,.drum-block { font-family: 'Courier Prime', monospace; line-height: 1.6; }
        .drum-line { color: #7C3AED; font-family: 'Courier Prime', monospace; white-space: pre-wrap; word-break: break-word; margin-bottom: 2px; }
        .song-meta-pills { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .meta-pill { font-size: .7rem; font-weight: 700; background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 2px 9px; color: var(--muted); }
        .sec-editor-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; max-height: 460px; overflow-y: auto; }
        .sec-editor-list::-webkit-scrollbar { width: 4px; }
        .sec-editor-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .sec-editor-card { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; overflow: hidden; transition: box-shadow .15s; }
        .sec-editor-card:hover { box-shadow: var(--shadow-md); }
        .sec-editor-expanded { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.1) !important; }
        .sec-editor-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--panel); border-bottom: 1px solid var(--border); gap: 8px; flex-wrap: wrap; }
        .sec-editor-label-btn { background: none; border: none; display: flex; align-items: center; cursor: pointer; flex: 1; min-width: 0; padding: 0; }
        .sec-editor-label { font-size: .82rem; font-weight: 800; color: var(--accent); letter-spacing: .06em; text-transform: uppercase; }
        .sec-editor-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
        .sec-editor-tabs { display: flex; gap: 2px; padding: 6px 10px 0; background: var(--panel); }
        .sec-tab-btn { padding: 6px 14px; border: none; border-radius: 7px 7px 0 0; font-size: .72rem; font-weight: 700; cursor: pointer; background: var(--bg); color: var(--muted); transition: all .15s; border-bottom: 2px solid transparent; }
        .sec-tab-btn.active { background: var(--accent-light); color: var(--accent); border-bottom-color: var(--accent); }
        .sec-textarea { width: 100%; padding: 12px 14px; background: white; border: none; border-top: 1px solid var(--border); font-family: 'Courier Prime', monospace; font-size: .88rem; color: var(--text); resize: vertical; outline: none; min-height: 100px; line-height: 1.6; }
        .sec-textarea:focus { background: #FAFBFF; }
        .sec-visible-btn { padding: 5px 10px; border-radius: 20px; border: 1.5px solid var(--green); background: white; color: var(--green); font-size: .68rem; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .sec-visible-btn.hidden { color: var(--muted); background: var(--bg); border-color: var(--border); border-style: dashed; }
        .section-btn-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .section-add-btn { padding: 7px 13px; border-radius: 20px; border: 1.5px solid var(--border); background: white; color: var(--text2); font-size: .72rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); }
        .section-add-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .arrangement-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .arr-pill { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--accent); background: var(--accent-light); color: var(--accent); font-size: .72rem; font-weight: 700; cursor: pointer; transition: all .15s; }
        .arr-pill-hidden { border-color: var(--border); background: var(--bg); color: var(--muted); border-style: dashed; text-decoration: line-through; opacity: .7; }
        .fs-song-section { margin-bottom: 24px; }
        .fs-section-label { display: inline-block; font-weight: 800; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: #93C5FD; background: rgba(147,197,253,.1); padding: 3px 12px; border-radius: 20px; margin-bottom: 10px; border: 1px solid rgba(147,197,253,.25); }
        .fs-lyric-block,.fs-chord-block { font-family: 'Courier Prime', monospace; line-height: 1.7; }
        .fs-drum-line { font-family: 'Courier Prime', monospace; color: #A78BFA; white-space: pre-wrap; word-break: break-word; margin-bottom: 4px; line-height: 1.6; }
        .fs-zoom-btn { padding: 5px 12px; background: #1E293B; border: 1px solid #334155; border-radius: 6px; color: #CBD5E1; font-size: .8rem; font-weight: 700; cursor: pointer; min-height: 34px; transition: background .15s; }
        .fs-zoom-btn:hover { background: var(--accent); color: white; }
        .desktop-song-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding-top: 18px; border-top: 2px solid var(--border); gap: 12px; }
        .dsn-btn { flex: 1; padding: 13px 16px; background: white; border: 1.5px solid var(--border); border-radius: 10px; color: var(--text); font-size: .85rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dsn-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .dsn-btn:disabled { opacity: .3; cursor: default; }
        .mobile-song-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: stretch; background: white; border-top: 2px solid var(--border); box-shadow: 0 -4px 16px rgba(0,0,0,.1); min-height: 72px; z-index: 50; }
        .msn-btn { flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: none; background: transparent; color: var(--text); cursor: pointer; transition: background .15s; }
        .msn-btn:disabled { opacity: .25; cursor: default; }
        .msn-btn:not(:disabled):hover { background: var(--accent-light); }
        .msn-right { justify-content: flex-end; border-left: 1px solid var(--border); }
        .msn-arrow { font-size: 2.4rem; color: var(--accent); font-weight: 300; line-height: 1; flex-shrink: 0; }
        .msn-label { font-size: .72rem; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .msn-counter { font-family: 'Courier Prime',monospace; font-size: .75rem; color: var(--muted); padding: 0 10px; display: flex; align-items: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); white-space: nowrap; }
        .mobile-setlist { display: none; flex: 1; flex-direction: column; overflow: hidden; }
        @media (max-width: 767px) { .mobile-setlist { display: flex !important; } .page-body { display: none !important; } }
        @media (max-width: 900px) {
          .toggle-btn { padding: 9px 13px !important; font-size: .72rem !important; min-height: 40px !important; }
          .btn-icon { width: 40px !important; height: 40px !important; font-size: 1rem !important; }
          .sl-ctrl-row { padding: 10px 12px !important; gap: 8px !important; }
          .song-row { min-height: 58px !important; padding: 12px 10px !important; }
          .row-btn { width: 36px !important; height: 36px !important; font-size: .9rem !important; }
          .btn-full { padding: 14px !important; }
          .sidebar-tab { padding: 14px 8px !important; min-height: 52px !important; }
          .sec-textarea { font-size: .82rem !important; }
        }
      `}</style>

      <Controls />

      {fullscreen && (
        <FullscreenView
          setlistSongs={setlistSongs}
          currentIndex={fsIndex}
          onIndexChange={handleFsIndexChange}
          useFlats={useFlats}
          nashville={nashville}
          displayMode={displayMode}
          onClose={()=>setFullscreen(false)}
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
                  <button className="dsn-btn" disabled={currentSetlistIndex<=0} onClick={()=>setCurrentIndexInSetlist(currentSetlistIndex-1)}>
                    ‹ {currentSetlistIndex>0?setlistSongs[currentSetlistIndex-1].title:""}
                  </button>
                  <button className="dsn-btn" disabled={currentSetlistIndex>=setlistSongs.length-1} onClick={()=>setCurrentIndexInSetlist(currentSetlistIndex+1)}>
                    {currentSetlistIndex<setlistSongs.length-1?setlistSongs[currentSetlistIndex+1].title:""} ›
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
      <div className="mobile-setlist">
        {mobileView==="list" ? (
          <SongList mobile />
        ) : (
          <>
            <div className="mobile-song-back">
              <button className="btn-ghost" style={{padding:"9px 14px",fontSize:"0.82rem"}} onClick={()=>setMobileView("list")}>← Back</button>
              {currentSong&&<span style={{fontWeight:700,fontSize:"0.88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentSong.title}</span>}
              {currentSong&&setlistSongs.length>0&&(
                <button className="btn-perform" style={{fontSize:"0.75rem",padding:"8px 12px"}} onClick={openFullscreen}>⛶</button>
              )}
              {currentSong&&<button className="row-btn" style={{opacity:1,width:"36px",height:"36px"}} onClick={()=>setEditing(currentSong)}>✏️</button>}
            </div>
            <main className="main" style={{flex:1,paddingBottom:"80px"}}>
              {currentSong ? (
                <SongDisplay song={currentSong} useFlats={useFlats} nashville={nashville} displayMode={displayMode}/>
              ) : (
                <div className="empty-state"><div className="empty-icon">🎸</div><div className="empty-text">No song selected</div></div>
              )}
            </main>
            {setlistSongs.length>1&&(
              <div className="mobile-song-nav">
                <button className="msn-btn" disabled={currentSetlistIndex<=0} onClick={()=>setCurrentIndexInSetlist(currentSetlistIndex-1)}>
                  <span className="msn-arrow">‹</span>
                  <span className="msn-label">{currentSetlistIndex>0?setlistSongs[currentSetlistIndex-1].title:"—"}</span>
                </button>
                <span className="msn-counter">{currentSetlistIndex+1}/{setlistSongs.length}</span>
                <button className="msn-btn msn-right" disabled={currentSetlistIndex>=setlistSongs.length-1} onClick={()=>setCurrentIndexInSetlist(currentSetlistIndex+1)}>
                  <span className="msn-label">{currentSetlistIndex<setlistSongs.length-1?setlistSongs[currentSetlistIndex+1].title:"—"}</span>
                  <span className="msn-arrow">›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editing&&<SongEditor song={editing} onSave={saveSong} onCancel={()=>setEditing(null)}/>}
    </>
  );
}
