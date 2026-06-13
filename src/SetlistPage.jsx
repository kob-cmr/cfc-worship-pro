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

// ── Special marker parsers ────────────────────────────────────────────────────
const KEY_CHANGE_RE = /^\[KEY:\s*([A-Ga-g][b#]?m?)\s*\]$/i;
const NOTE_RE = /^\[NOTE:\s*(.*)\]$/i;

function parseKeyChange(line) {
  const m = line.trim().match(KEY_CHANGE_RE);
  return m ? m[1] : null;
}
function parseNote(line) {
  const m = line.trim().match(NOTE_RE);
  return m ? m[1] : null;
}

// ── Render a single chords block with key changes and notes ───────────────────
function renderChordsBlock({ content, semitones, useFlats, nashville, baseRootKey, zoom, fsMode }) {
  let currentRoot = baseRootKey; // tracks current key as we parse lines
  const lines = (content || "").split("\n");
  return lines.map((line, i) => {
    const raw = line.trim();

    // Empty line spacer
    if (!raw) return <div key={i} style={{ height: "6px" }} />;

    // [KEY: Eb] — key change marker
    const newKey = parseKeyChange(raw);
    if (newKey !== null) {
      // Update current root for subsequent lines (side-effectful in render, use a closure trick)
      const displayKey = transposeNote(newKey.replace("m",""), semitones, useFlats) + (newKey.includes("m") ? "m" : "");
      currentRoot = transposeNote(newKey.replace("m",""), 0, false); // store original new key
      return (
        <div key={i} className={fsMode ? "fs-key-change" : "key-change-marker"}
          style={zoom ? { fontSize: `${zoom * 0.78}rem` } : {}}>
          🔑 Key change → {displayKey}
        </div>
      );
    }

    // [NOTE: ...] — performance note, never transposed
    const noteText = parseNote(raw);
    if (noteText !== null) {
      return (
        <div key={i} className={fsMode ? "fs-perf-note" : "perf-note-marker"}
          style={zoom ? { fontSize: `${zoom * 0.8}rem` } : {}}>
          📝 {noteText}
        </div>
      );
    }

    // Regular chord line — transpose with current root
    const t = transposeChordLine(line, semitones, useFlats, nashville, currentRoot);
    return (
      <div key={i} className={fsMode ? "fs-chord-line" : "chord-line"}
        style={zoom ? { fontSize: `${zoom}rem` } : {}}>
        {t || line}
      </div>
    );
  });
}

// ── Render sections for display ───────────────────────────────────────────────
function renderSections({ sections, displayMode, semitones, useFlats, nashville, rootKey, zoom, fsMode }) {
  const visible = sections.filter(s => s.visible !== false);
  // Track current key across sections for key changes
  let currentSectionRoot = rootKey;

  return visible.map(sec => {
    // Update root at section boundary — check if section starts with a key change
    const firstLine = (sec.chords || "").split("\n").find(l => l.trim());
    const sectionKeyChange = firstLine ? parseKeyChange(firstLine.trim()) : null;
    if (sectionKeyChange) {
      currentSectionRoot = transposeNote(sectionKeyChange.replace("m",""), semitones, useFlats);
    }

    return (
      <div key={sec.id} className={fsMode ? "fs-song-section" : "song-section"}>
        {/* Section label */}
        <div className={fsMode ? "fs-section-label" : "section-label"}
          style={zoom ? { fontSize: `${zoom * 0.82}rem` } : {}}>
          {sec.label}
        </div>

        {displayMode === "lyrics" && (
          <div className={fsMode ? "fs-lyric-block" : "lyric-block"}>
            {(sec.lyrics || "—").split("\n").map((line, i) => {
              const noteText = parseNote(line.trim());
              if (noteText !== null) {
                return <div key={i} className={fsMode?"fs-perf-note":"perf-note-marker"} style={zoom?{fontSize:`${zoom*.8}rem`}:{}}> 📝 {noteText}</div>;
              }
              return <div key={i} className={fsMode?"fs-lyric-line":"lyric-line"} style={zoom?{fontSize:`${zoom}rem`}:{}}>{line || "\u00A0"}</div>;
            })}
          </div>
        )}

        {displayMode === "chords" && (
          <div className={fsMode ? "fs-chord-block" : "chord-block"}>
            {renderChordsBlock({ content: sec.chords, semitones, useFlats, nashville, baseRootKey: currentSectionRoot, zoom, fsMode })}
          </div>
        )}

        {displayMode === "drums" && (
          <div className="drum-block">
            {(sec.drums || "—").split("\n").map((line, i) => {
              const noteText = parseNote(line.trim());
              if (noteText !== null) {
                return <div key={i} className={fsMode?"fs-perf-note":"perf-note-marker"} style={zoom?{fontSize:`${zoom*.8}rem`}:{}}> 📝 {noteText}</div>;
              }
              return <div key={i} className={fsMode?"fs-drum-line":"drum-line"} style={zoom?{fontSize:`${zoom}rem`}:{}}>{line || "\u00A0"}</div>;
            })}
          </div>
        )}
      </div>
    );
  });
}

// ── Song Display ──────────────────────────────────────────────────────────────
function SongDisplay({ song, useFlats, nashville, displayMode }) {
  const semitones = song.semitones || 0;
  const rootKey = transposeNote(song.key.replace("m",""), semitones, useFlats);
  const effectiveKey = rootKey + (song.key.includes("m") && !song.key.includes("maj") ? "m" : "");
  const sections = (song.sections && song.sections.length > 0)
    ? song.sections
    : (song.lyrics ? [{ id:"whole-lyrics", type:"Lyrics", label:"Full Lyrics", visible:true, lyrics:song.lyrics, chords:"", drums:"" }] : []);

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
function SectionEditor({ section, onUpdate, onDelete, onMove, isFirst, isLast, expanded, onToggle }) {
  const [tab, setTab] = useState("chords");
  const tabs = [
    { id:"chords", label:"🎸 Chords" },
    { id:"lyrics", label:"🎤 Lyrics" },
    { id:"drums",  label:"🥁 Drums" },
  ];
  return (
    <div className={`sec-editor-card ${expanded?"sec-editor-expanded":""}`}>
      <div className="sec-editor-header">
        <button className="sec-editor-label-btn" onClick={onToggle}>
          <span className="sec-editor-label">{section.label}</span>
          <span style={{fontSize:".75rem",marginLeft:6,color:"var(--muted)"}}>{expanded?"▲":"▼"}</span>
        </button>
        <div className="sec-editor-actions">
          <button className="icon-btn" disabled={isFirst} onClick={() => onMove(-1)}>↑</button>
          <button className="icon-btn" disabled={isLast}  onClick={() => onMove(1)}>↓</button>
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
            <>
              <div className="sec-insert-bar">
                <span className="sec-insert-label">Insert:</span>
                <button className="sec-insert-btn key-btn" onClick={() => {
                  const key = prompt("Enter new key (e.g. Eb, F#m, Am):");
                  if (key && key.trim()) {
                    const marker = `[KEY: ${key.trim()}]`;
                    onUpdate({...section, chords: (section.chords||"") + (section.chords ? "\n" : "") + marker});
                  }
                }}>🔑 Key Change</button>
                <button className="sec-insert-btn note-btn" onClick={() => {
                  const note = prompt("Enter performance note (e.g. Mellow, Build up, Soft):");
                  if (note && note.trim()) {
                    const marker = `[NOTE: ${note.trim()}]`;
                    onUpdate({...section, chords: (section.chords||"") + (section.chords ? "\n" : "") + marker});
                  }
                }}>📝 Note</button>
              </div>
              <textarea className="sec-textarea"
                value={section.chords||""}
                onChange={e => onUpdate({...section, chords:e.target.value})}
                placeholder={"Chords only:\n\nG    D    Em   C\n1    5    6m   4\n\n[KEY: Eb]   ← key change\n[NOTE: Build up]   ← performance note"}
                rows={7}/>
            </>
          )}
          {tab === "lyrics" && (
            <textarea className="sec-textarea"
              value={section.lyrics||""}
              onChange={e => onUpdate({...section, lyrics:e.target.value})}
              placeholder={"Lyrics:\n\nAmazing grace how sweet the sound\nThat saved a wretch like me"}
              rows={6}/>
          )}
          {tab === "drums" && (
            <textarea className="sec-textarea"
              value={section.drums||""}
              onChange={e => onUpdate({...section, drums:e.target.value})}
              placeholder={"Drum notes:\n\nHi-hat 8ths, kick on 1 & 3"}
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
  const [expandedId, setExpandedId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(true); // collapsible top section
  const [selectedLyrics, setSelectedLyrics] = useState("");
  const [newSectionType, setNewSectionType] = useState("Verse");
  const [newSectionNumber, setNewSectionNumber] = useState("");
  const lyricsRef = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const listRef = useRef(null);

  const addSection = (type) => {
    const existing = countOfType(form.sections, type);
    const num = existing > 0 ? existing + 1 : (["Intro","Outro","Bridge","Tag","Interlude"].includes(type) ? null : 1);
    const sec = makeSection(type, num);
    set("sections", [...form.sections, sec]);
    setExpandedId(sec.id);
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 60);
  };

  const updateSection = (updated) => set("sections", form.sections.map(s => s.id === updated.id ? updated : s));
  const deleteSection = (id) => { set("sections", form.sections.filter(s => s.id !== id)); if (expandedId===id) setExpandedId(null); };
  const moveSection = (idx, dir) => { const arr=[...form.sections],to=idx+dir; if(to<0||to>=arr.length)return; [arr[idx],arr[to]]=[arr[to],arr[idx]]; set("sections",arr); };
  const toggleExpand = (id) => setExpandedId(prev => prev===id ? null : id);

  const handleLyricsSelect = () => {
    const textarea = lyricsRef.current;
    if (!textarea) return;
    const text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    setSelectedLyrics(text);
  };

  const addSectionFromSelection = () => {
    const selected = selectedLyrics.trim();
    if (!selected) {
      window.alert("Select lyrics from the full lyrics box before creating a section.");
      return;
    }
    const existing = countOfType(form.sections, newSectionType);
    const number = newSectionNumber ? Number(newSectionNumber) : (['Intro','Outro','Bridge','Tag','Interlude'].includes(newSectionType) ? null : existing + 1);
    const sec = makeSection(newSectionType, number);
    sec.label = number ? `${newSectionType} ${number}` : newSectionType;
    sec.lyrics = selected;
    set("sections", [...form.sections, sec]);
    setExpandedId(sec.id);
    setSelectedLyrics("");
    setNewSectionNumber("");
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 60);
  };

  return (
    <div className="editor-overlay" style={{alignItems:"stretch",padding:0}}>
      <div style={{
        background:"white", display:"flex", flexDirection:"column",
        width:"100%", maxWidth:680, margin:"0 auto",
        height:"100%", maxHeight:"100vh",
        borderRadius:0, overflow:"hidden",
      }}>
        {/* ── Fixed top bar: title + cancel ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px 10px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"white"}}>
          <h2 className="editor-title" style={{margin:0,fontSize:"1rem"}}>{song.id ? "Edit Song" : "New Song"}</h2>
          <button className="btn-ghost" style={{padding:"6px 12px",fontSize:".75rem"}} onClick={onCancel}>✕</button>
        </div>

        {/* ── Collapsible details section ── */}
        <div style={{flexShrink:0,borderBottom:"1px solid var(--border)",background:"white"}}>
          <button
            onClick={() => setDetailsOpen(o=>!o)}
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:".75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>
            <span>Song Details</span>
            <span>{detailsOpen ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {detailsOpen && (
            <div style={{padding:"0 18px 12px"}}>
              <div className="editor-row" style={{marginBottom:0}}>
                <div className="editor-field">
                  <label>Title</label>
                  <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Song title"/>
                </div>
                <div className="editor-field">
                  <label>Artist</label>
                  <input value={form.artist} onChange={e=>set("artist",e.target.value)} placeholder="Artist name"/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <div className="editor-field" style={{flex:"0 0 100px",marginBottom:0}}>
                  <label>Key</label>
                  <select value={form.key} onChange={e=>set("key",e.target.value)}>
                    {KEYS.map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="editor-field" style={{flex:"0 0 80px",marginBottom:0}}>
                  <label>BPM</label>
                  <input type="number" min="40" max="300" value={form.bpm||""} onChange={e=>set("bpm",e.target.value)} placeholder="120"/>
                </div>
                <div className="editor-field" style={{flex:"0 0 90px",marginBottom:0}}>
                  <label>Time Sig</label>
                  <select value={form.tempoSig||"4/4"} onChange={e=>set("tempoSig",e.target.value)}>
                    {TEMPO_SIGS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Fixed: full lyrics source + section add buttons + arrangement ── */}
        <div style={{flexShrink:0,borderBottom:"1px solid var(--border)",padding:"10px 18px",background:"white"}}>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Full Lyrics</label>
            <textarea ref={lyricsRef}
              className="sec-textarea"
              value={form.lyrics||""}
              onChange={e => { set("lyrics", e.target.value); }}
              onSelect={handleLyricsSelect}
              onMouseUp={handleLyricsSelect}
              placeholder={"Paste the entire song lyrics here. Then select each verse, chorus, intro, etc. and create a section from the selection."}
              rows={10}
            />
            <div className="selection-helper">
              <div>
                {selectedLyrics
                  ? `Selected lyrics preview: ${selectedLyrics.split("\n").length} line${selectedLyrics.split("\n").length===1?"":"s"}`
                  : "Select a portion of the lyrics above to create a section."}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,alignItems:"center"}}>
                <select value={newSectionType} onChange={e=>setNewSectionType(e.target.value)}
                  style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid var(--border)",background:"white",minWidth:120}}>
                  {SECTION_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
                </select>
                <input type="number" min="1" value={newSectionNumber}
                  onChange={e=>setNewSectionNumber(e.target.value)}
                  placeholder="Number (optional)"
                  style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid var(--border)",width:120}} />
                <button className="btn-ghost" disabled={!selectedLyrics.trim()} onClick={addSectionFromSelection}
                  style={{padding:"8px 14px",fontSize:"0.8rem"}}>
                  + Create section from selection
                </button>
              </div>
            </div>
          </div>

          <div style={{marginBottom:form.sections.length>0?8:0}}>
            <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Quick Add Section</label>
            <div className="section-btn-row">
              {SECTION_TYPES.map(type=>(
                <button key={type} className="section-add-btn" onClick={()=>addSection(type)}>+ {type}</button>
              ))}
            </div>
          </div>
          {form.sections.length > 0 && (
            <div>
              <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:5}}>
                Arrangement <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>— tap to show/hide</span>
              </label>
              <div className="arrangement-pills">
                {form.sections.map(sec=>(
                  <button key={sec.id}
                    className={`arr-pill ${sec.visible===false?"arr-pill-hidden":""}`}
                    onClick={()=>updateSection({...sec,visible:sec.visible===false?true:false})}>
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Scrollable sections list ── */}
        <div ref={listRef} style={{flex:1,overflowY:"auto",padding:"10px 18px",display:"flex",flexDirection:"column",gap:8,background:"var(--bg)"}}>
          {form.sections.length===0 && (
            <div style={{padding:"20px",textAlign:"center",color:"var(--muted)",fontSize:".82rem",background:"white",borderRadius:"10px",border:"1.5px dashed var(--border)"}}>
              Tap the section buttons above to build your song structure
            </div>
          )}
          {form.sections.map((sec,i)=>(
            <SectionEditor key={sec.id} section={sec}
              expanded={expandedId===sec.id}
              onToggle={()=>toggleExpand(sec.id)}
              onUpdate={updateSection}
              onDelete={deleteSection}
              onMove={(dir)=>moveSection(i,dir)}
              isFirst={i===0} isLast={i===form.sections.length-1}/>
          ))}
        </div>

        {/* ── Fixed save button ── */}
        <div style={{padding:"12px 18px",borderTop:"1px solid var(--border)",background:"white",flexShrink:0}}>
          <button className="btn-full" onClick={()=>{
            const rootKey=form.key.replace("m","");
            const converted={
              ...form,
              sections:(form.sections||[]).map(sec=>({
                ...sec,
                chords:(sec.chords||"").split("\n").map(line=>
                  isNashvilleLine(line)?nashvilleLineToStandard(line,rootKey):line
                ).join("\n")
              }))
            };
            onSave(converted);
          }}>💾 Save Song</button>
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
  const contentRef = useRef(null);
  const indexRef = useRef(currentIndex);
  const lengthRef = useRef(setlistSongs.length);
  indexRef.current = currentIndex;
  lengthRef.current = setlistSongs.length;

  // Scroll to top whenever song changes
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [currentIndex]);

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

      <div className="fs-content" ref={contentRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
  const [selectedProgramId, setSelectedProgramId] = useState(
    programs.length > 0 ? programs[programs.length-1].id : null
  );
  const selectedProgram = programs.find(p => p.id === selectedProgramId) || programs[programs.length-1] || null;

  // Build an ordered list of { type: "divider"|"song", label?, songId?, song? }
  // from the program items — sections become dividers, songs come after their section
  const setlistItems = (() => {
    if (!selectedProgram) return [];
    const result = [];
    for (const item of selectedProgram.items) {
      if (item.type === "section") {
        // Add section divider
        result.push({ type: "divider", id: item.id, label: item.label || item.activity || "Section" });
        // Add any songs nested inside this section
        for (const ss of (item.sectionSongs || [])) {
          const song = songs.find(s => s.id === ss.songId);
          if (song) result.push({ type: "song", id: `ss-${ss.id}`, song, sectionLabel: item.label });
        }
      } else if (item.type === "song" && item.songId) {
        const song = songs.find(s => s.id === item.songId);
        if (song) result.push({ type: "song", id: `prog-${item.id}`, song, sectionLabel: null });
      }
    }
    return result;
  })();

  const setlistSongs = setlistItems.filter(i => i.type === "song").map(i => i.song);
  const setlist = setlistSongs.map(s => s.id);
  const setSetlist = () => {};

  const [activeSong, setActiveSong] = useState(setlist[0]||null);
  const [displayMode, setDisplayMode] = useState("chords");
  const [editing, setEditing] = useState(null);
  const [sideView, setSideView] = useState("setlist");
  const [mobileView, setMobileView] = useState("list");
  const [fsIndex, setFsIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const currentSong = songs.find(s=>s.id===activeSong);
  const currentSetlistIndex = setlistSongs.findIndex(s=>s.id===activeSong);

  const openFullscreen = () => {
    setFsIndex(currentSetlistIndex>=0?currentSetlistIndex:0);
    setFullscreen(true);
  };
  const handleFsIndexChange = (idx) => {
    setFsIndex(idx);
    if (idx>=0&&idx<setlistSongs.length) setActiveSong(setlistSongs[idx].id);
  };
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
    if (activeSong===id) setActiveSong(null);
  };
  const toggleSetlist = () => {};
  const handleDrop = (targetId) => {
    if (!dragging||dragging===targetId){setDragging(null);setDragOver(null);return;}
    setDragging(null);setDragOver(null);
  };
  const selectSong = (id)=>{setActiveSong(id);setMobileView("song");};

  const SongList = ({mobile=false})=>(
    <>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${sideView==="setlist"?"active":""}`} onClick={()=>setSideView("setlist")}>Setlist ({setlistSongs.length})</button>
        <button className={`sidebar-tab ${sideView==="library"?"active":""}`} onClick={()=>setSideView("library")}>Library ({songs.length})</button>
      </div>
      <div className="sidebar-list">
        {sideView==="setlist" && (
          setlistItems.length === 0
            ? <div className="empty-sidebar">No songs in program.<br/>Add songs in the Program tab.</div>
            : setlistItems.map((item, i) => {
                if (item.type === "divider") {
                  return (
                    <div key={item.id} className="setlist-section-divider">
                      {item.label}
                    </div>
                  );
                }
                const song = item.song;
                const songIdx = setlistSongs.findIndex(s => s.id === song.id);
                return (
                  <div key={item.id}
                    className={`song-row ${activeSong===song.id?"active":""}`}
                    onClick={()=>mobile?selectSong(song.id):setActiveSong(song.id)}>
                    <span className="song-row-num">{songIdx+1}</span>
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
                    </div>
                  </div>
                );
              })
        )}
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
      <div className="sl-ctrl-row" style={{alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
        <span className="ctrl-song-name" style={{fontWeight:700}}>{currentSong?currentSong.title:"—"}</span>
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
        .setlist-section-divider { display: flex; align-items: center; gap: 8px; padding: 8px 10px 4px; font-size: .65rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); margin-top: 6px; }
        .setlist-section-divider::after { content: ""; flex: 1; height: 1px; background: #BFDBFE; }
        /* Key change and note markers */
        .key-change-marker { display:inline-flex; align-items:center; gap:6px; font-size:.75rem; font-weight:800; color:#D97706; background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:20px; padding:3px 12px; margin:6px 0 4px; }
        .perf-note-marker { display:inline-flex; align-items:center; gap:6px; font-size:.75rem; font-weight:600; color:#6B7280; background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:8px; padding:3px 12px; margin:4px 0; font-style:italic; }
        .fs-key-change { display:inline-flex; align-items:center; gap:6px; font-weight:800; color:#FCD34D; background:rgba(252,211,77,.12); border:1.5px solid rgba(252,211,77,.3); border-radius:20px; padding:4px 14px; margin:8px 0 6px; }
        .fs-perf-note { display:inline-flex; align-items:center; gap:6px; font-weight:600; color:#94A3B8; background:rgba(148,163,184,.08); border:1px solid rgba(148,163,184,.2); border-radius:8px; padding:3px 12px; margin:4px 0; font-style:italic; }
        /* Insert bar in section editor */
        .sec-insert-bar { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--panel); border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .sec-insert-label { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
        .sec-insert-btn { padding:4px 12px; border-radius:20px; border:1.5px solid; font-size:.7rem; font-weight:700; cursor:pointer; transition:all .15s; }
        .sec-insert-btn.key-btn { border-color:#FDE68A; color:#D97706; background:#FFFBEB; }
        .sec-insert-btn.key-btn:hover { background:#D97706; color:white; border-color:#D97706; }
        .sec-insert-btn.note-btn { border-color:#E5E7EB; color:#6B7280; background:#F9FAFB; }
        .sec-insert-btn.note-btn:hover { background:#6B7280; color:white; border-color:#6B7280; }
        .song-section { margin-bottom: 20px; }
        .section-label { display: inline-block; font-weight: 800; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); padding: 3px 12px; border-radius: 20px; margin-bottom: 8px; border: 1px solid #BFDBFE; }
        .lyric-block,.chord-block,.drum-block { font-family: 'Courier Prime', monospace; line-height: 1.6; }
        .drum-line { color: #7C3AED; font-family: 'Courier Prime', monospace; white-space: pre-wrap; word-break: break-word; margin-bottom: 2px; }
        .song-meta-pills { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .meta-pill { font-size: .7rem; font-weight: 700; background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 2px 9px; color: var(--muted); }
        .song-editor-top { padding: 20px 20px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border); background: white; }
        .song-editor-sections { flex: 1; overflow-y: auto; padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; background: var(--bg); }
        .song-editor-sections::-webkit-scrollbar { width: 5px; }
        .song-editor-sections::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .song-editor-bottom { padding: 12px 20px; border-top: 1px solid var(--border); background: white; flex-shrink: 0; }
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
        .selection-helper { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; font-size: .82rem; color: var(--muted); }
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
          useFlats={false}
          nashville={false}
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
              <SongDisplay song={currentSong} useFlats={false} nashville={false} displayMode={displayMode} />
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
                <SongDisplay song={currentSong} useFlats={false} nashville={false} displayMode={displayMode}/>
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
