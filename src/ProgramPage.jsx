import { useState, useCallback, useRef } from "react";
import { ProgramPreviewModal } from "./ProgramPreview.jsx";

const SECTION_PRESETS = [
  "Pre-Service","Welcome & Announcements","Opening Prayer","Scripture Reading",
  "Sermon","Offering","Communion","Closing Prayer","Benediction",
  "Special Number","Testimony","Children's Moment","Greeting Time","Dismissal",
];
const EVENT_TYPES = [
  "Sunday Worship Service","Wednesday Prayer Meeting","Youth Service",
  "Special Event","Fellowship","Outreach","Other",
];

function newProgram(overrides = {}) {
  return {
    id: `prog-${Date.now()}`,
    title: "Sunday Worship Service",
    eventType: "Sunday Worship Service",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    speaker: "", sermonTitle: "", scripture: "", notes: "",
    items: [],
    ...overrides,
  };
}

function formatDuration(mins) {
  if (!mins) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Item Row ──────────────────────────────────────────────────────────────────
function ItemRow({ item, songs, index, total, onUpdate, onDelete, onMove, dragHandleProps }) {
  const [expanded, setExpanded] = useState(false);
  const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;

  return (
    <div className={`prog-item ${item.type}`} style={{flexDirection:"column",gap:0,padding:0}}>
      {/* Header row — always visible */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px"}}>
        {/* Drag handle */}
        <span className="prog-drag-handle" {...dragHandleProps} title="Drag to reorder">⠿</span>
        <span className="prog-num">{index + 1}</span>
        <span className="prog-type-badge">{item.type === "song" ? "🎵" : "📋"}</span>
        <div style={{flex:1,minWidth:0}}>
          {item.type === "song" ? (
            <select className="prog-select" value={item.songId || ""}
              onChange={e => onUpdate({ ...item, songId: Number(e.target.value) || null })}>
              <option value="">— choose a song —</option>
              {songs.map(s => <option key={s.id} value={s.id}>{s.title} ({s.key})</option>)}
            </select>
          ) : (
            <input className="prog-input" value={item.label || ""}
              onChange={e => onUpdate({ ...item, label: e.target.value })}
              placeholder="Section name…" list="section-presets" />
          )}
        </div>
        <button className="icon-btn" style={{fontSize:".7rem"}} onClick={() => setExpanded(e=>!e)}
          title={expanded?"Collapse":"Expand"}>
          {expanded?"▲":"▼"}
        </button>
        <button className="icon-btn danger" onClick={() => onDelete(item.id)}>✕</button>
      </div>

      {/* Expanded detail fields */}
      {expanded && (
        <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid var(--border)"}}>
          {item.type === "song" && song && (
            <div style={{fontSize:".75rem",color:"var(--muted)",paddingTop:8}}>{song.artist} · Key of {song.key}</div>
          )}

          {item.type === "section" && (
            <>
              <div style={{paddingTop:8}}>
                <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:4}}>Activity</label>
                <input className="prog-input" value={item.activity||""}
                  onChange={e => onUpdate({...item, activity:e.target.value})}
                  placeholder="e.g. Praise & Worship, Opening Prayer…" />
              </div>
              <div>
                <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:4}}>In Charge</label>
                <input className="prog-input" value={item.inCharge||""}
                  onChange={e => onUpdate({...item, inCharge:e.target.value})}
                  placeholder="Person responsible…" />
              </div>
              <div>
                <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:4}}>Notes</label>
                <input className="prog-input" value={item.notes||""}
                  onChange={e => onUpdate({...item, notes:e.target.value})}
                  placeholder="Any notes or instructions…" />
              </div>
              {/* Songs inside this section */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <label style={{fontSize:".62rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"var(--muted)"}}>Songs in this section</label>
                  <button className="pill-btn accent" style={{fontSize:".65rem",padding:"3px 10px"}}
                    onClick={() => onUpdate({...item, sectionSongs:[...(item.sectionSongs||[]),{id:`ss-${Date.now()}`,songId:null}]})}>
                    + Add Song
                  </button>
                </div>
                {(item.sectionSongs||[]).map((ss,si) => {
                  const ssong = songs.find(s=>s.id===ss.songId);
                  return (
                    <div key={ss.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                      <span style={{fontSize:".7rem",color:"var(--muted)",minWidth:18,textAlign:"right"}}>{si+1}.</span>
                      <select className="prog-select" style={{flex:1}} value={ss.songId||""}
                        onChange={e => onUpdate({...item, sectionSongs:item.sectionSongs.map(x=>x.id===ss.id?{...x,songId:Number(e.target.value)||null}:x)})}>
                        <option value="">— choose a song —</option>
                        {songs.map(s=><option key={s.id} value={s.id}>{s.title} ({s.key})</option>)}
                      </select>
                      <button className="icon-btn danger" style={{width:28,height:28}}
                        onClick={()=>onUpdate({...item,sectionSongs:item.sectionSongs.filter(x=>x.id!==ss.id)})}>✕</button>
                    </div>
                  );
                })}
                {(item.sectionSongs||[]).length===0 && (
                  <div style={{fontSize:".72rem",color:"var(--muted)",fontStyle:"italic"}}>No songs added yet.</div>
                )}
              </div>
            </>
          )}

          {/* Duration — for all items */}
          <div className="prog-duration-row">
            <span className="prog-duration-label">⏱ Duration</span>
            <input className="prog-input prog-duration-input" type="number"
              min="0" max="240" value={item.duration||""}
              onChange={e => onUpdate({...item, duration:e.target.value?Number(e.target.value):null})}
              placeholder="mins" />
            {item.duration ? <span className="prog-duration-badge">{item.duration} min</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Program List panel ────────────────────────────────────────────────────────
function ProgramList({ programs, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="prog-list-panel">
      <div className="prog-list-header">
        <div className="prog-section-title" style={{margin:0}}>Programs</div>
        <button className="pill-btn accent" onClick={onCreate}>+ New</button>
      </div>
      <div className="prog-list-items">
        {programs.length === 0 && <div className="empty-sidebar">No programs yet.<br/>Tap + New to create one.</div>}
        {[...programs].reverse().map(p => (
          <div key={p.id} className={`prog-list-row ${p.id===activeId?"active":""}`} onClick={() => onSelect(p.id)}>
            <div className="prog-list-row-info">
              <div className="prog-list-row-title">{p.title}</div>
              <div className="prog-list-row-meta">{p.eventType && p.eventType!==p.title?p.eventType+" · ":""}{p.date}</div>
            </div>
            {programs.length > 1 && (
              <button className="row-btn remove" style={{opacity:1,flexShrink:0}}
                onClick={e => { e.stopPropagation(); onDelete(p.id); }}>🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Service Details panel — standalone component (NOT nested) ─────────────────
function ServiceDetails({ program, onUpdateField }) {
  if (!program) return (
    <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No program selected</div></div>
  );
  return (
    <div className="prog-details">
      <div className="prog-section-title">Service Details</div>
      <div className="prog-field">
        <label>Event Type</label>
        <select value={program.eventType||""} onChange={e => {
          onUpdateField("eventType", e.target.value);
          if (!program.title || EVENT_TYPES.includes(program.title)) onUpdateField("title", e.target.value);
        }}>
          <option value="">Select type…</option>
          {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="prog-field">
        <label>Program Title</label>
        <input value={program.title} onChange={e => onUpdateField("title", e.target.value)} placeholder="e.g. Sunday Morning Worship" />
      </div>
      <div className="prog-field">
        <label>Date</label>
        <input type="date" value={program.date} onChange={e => onUpdateField("date", e.target.value)} />
      </div>
      <div className="prog-field">
        <label>Time</label>
        <input type="time" value={program.time} onChange={e => onUpdateField("time", e.target.value)} />
      </div>
      <div className="prog-field">
        <label>Speaker / Preacher</label>
        <input value={program.speaker} onChange={e => onUpdateField("speaker", e.target.value)} placeholder="Pastor name" />
      </div>
      <div className="prog-field">
        <label>Sermon Title</label>
        <input value={program.sermonTitle} onChange={e => onUpdateField("sermonTitle", e.target.value)} placeholder="Sermon title" />
      </div>
      <div className="prog-field">
        <label>Scripture Reading</label>
        <input value={program.scripture} onChange={e => onUpdateField("scripture", e.target.value)} placeholder="e.g. John 3:16-21" />
      </div>
      <div className="prog-field">
        <label>Team Notes</label>
        <textarea value={program.notes} onChange={e => onUpdateField("notes", e.target.value)} rows={3} placeholder="Internal notes for the worship team…" />
      </div>
    </div>
  );
}

// ── Order of Service panel — standalone component (NOT nested) ────────────────
function OrderOfService({ program, songs, onAddItem, onUpdateItem, onDeleteItem, onMoveItem }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  if (!program) return null;
  const totalMins = program.items.reduce((sum, i) => sum + (i.duration || 0), 0);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    onMoveItem(dragIdx, idx);
    setDragIdx(null); setDragOverIdx(null);
  };

  return (
    <div className="prog-order">
      {/* Sticky add buttons */}
      <div className="prog-order-sticky-header">
        <div className="prog-section-title" style={{margin:0}}>Order of Service</div>
        <div style={{display:"flex",gap:"6px"}}>
          <button className="pill-btn" onClick={() => onAddItem("section")}>+ Section</button>
          <button className="pill-btn accent" onClick={() => onAddItem("song")}>+ Song</button>
        </div>
      </div>
      <datalist id="section-presets">
        {SECTION_PRESETS.map(p => <option key={p} value={p} />)}
      </datalist>
      {program.items.length === 0 && (
        <div className="empty-state" style={{height:"160px"}}>
          <div className="empty-icon">📋</div>
          <div className="empty-text">No items yet</div>
          <div className="empty-sub">Add a section or song above</div>
        </div>
      )}
      <div className="prog-items-list">
        {program.items.map((item, i) => (
          <div key={item.id}
            draggable
            onDragStart={e => handleDragStart(e, i)}
            onDragOver={e => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            style={{
              opacity: dragIdx === i ? 0.4 : 1,
              borderRadius: 10,
              border: dragOverIdx === i && dragIdx !== i ? "2px dashed var(--accent)" : "2px solid transparent",
              transition: "border .1s, opacity .1s",
            }}>
            <ItemRow
              item={item} songs={songs} index={i}
              total={program.items.length}
              onUpdate={onUpdateItem} onDelete={onDeleteItem}
              onMove={onMoveItem}
            />
          </div>
        ))}
      </div>
      {totalMins > 0 && (
        <div className="prog-total-time">
          <span className="prog-total-label">⏱ Total Duration</span>
          <span className="prog-total-value">{formatDuration(totalMins)}</span>
        </div>
      )}
    </div>
  );
}

// ── Main ProgramPage ──────────────────────────────────────────────────────────
export default function ProgramPage({ songs, programs, setPrograms }) {
  const [activeId, setActiveId] = useState(programs[programs.length-1]?.id || null);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [mobileSection, setMobileSection] = useState("details");
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const program = programs.find(p => p.id === activeId) || null;

  // Local draft — edits go here first, only saved on button click
  const [draft, setDraft] = useState(null);
  const activeDraft = draft && draft.id === activeId ? draft : program;

  const updateField = useCallback((k, v) => {
    setDraft(prev => {
      const base = prev?.id === activeId ? prev : program;
      return { ...base, [k]: v };
    });
    setHasUnsaved(true);
  }, [activeId, program]);

  const updateProgram = useCallback((updater) => {
    setDraft(prev => {
      const base = prev?.id === activeId ? prev : program;
      return typeof updater === "function" ? updater(base) : { ...base, ...updater };
    });
    setHasUnsaved(true);
  }, [activeId, program]);

  const saveChanges = useCallback(() => {
    if (!draft) return;
    setPrograms(ps => ps.map(p => p.id === activeId ? draft : p));
    setHasUnsaved(false);
  }, [draft, activeId, setPrograms]);

  const discardChanges = useCallback(() => {
    setDraft(null);
    setHasUnsaved(false);
  }, []);

  const createProgram = () => {
    const np = newProgram();
    setPrograms(ps => [...ps, np]);
    setActiveId(np.id);
    setDraft(null);
    setHasUnsaved(false);
    setMobileView("detail");
  };

  const deleteProgram = (id) => {
    const remaining = programs.filter(p => p.id !== id);
    setPrograms(remaining);
    if (activeId === id) {
      setActiveId(remaining[remaining.length-1]?.id || null);
      setDraft(null);
      setHasUnsaved(false);
    }
  };

  const addItem = useCallback((type) => {
    const item = type === "song"
      ? { id: Date.now().toString(), type: "song", songId: null }
      : { id: Date.now().toString(), type: "section", label: "", notes: "" };
    updateProgram(p => ({ ...p, items: [...p.items, item] }));
  }, [updateProgram]);

  const updateItem = useCallback((updated) => {
    updateProgram(p => ({ ...p, items: p.items.map(i => i.id === updated.id ? updated : i) }));
  }, [updateProgram]);

  const deleteItem = useCallback((id) => {
    updateProgram(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  }, [updateProgram]);

  const moveItem = useCallback((from, to) => {
    updateProgram(p => {
      const items = [...p.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...p, items };
    });
  }, [updateProgram]);

  // Switch program — warn if unsaved
  const handleSelectProgram = (id) => {
    if (hasUnsaved) {
      if (window.confirm("You have unsaved changes. Discard them?")) {
        setDraft(null);
        setHasUnsaved(false);
        setActiveId(id);
        setMobileView("detail");
      }
    } else {
      setActiveId(id);
      setMobileView("detail");
    }
  };

  const songCount = activeDraft?.items.filter(i=>i.type==="song"&&i.songId).length||0;

  return (
    <div className="program-wrap">
      <style>{`
        .prog-drag-handle{font-size:1rem;color:var(--muted);cursor:grab;padding:2px 4px;flex-shrink:0;user-select:none}
        .prog-drag-handle:active{cursor:grabbing}
        .prog-order-sticky-header{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);margin-bottom:10px}
        .prog-duration-row{display:flex;align-items:center;gap:6px;margin-top:4px}
        .prog-duration-label{font-size:.75rem;color:var(--muted);flex-shrink:0}
        .prog-duration-input{max-width:70px!important;padding:4px 8px!important;font-size:.78rem!important;text-align:center}
        .prog-duration-badge{font-size:.7rem;font-weight:700;color:var(--accent);background:var(--accent-light);border:1px solid #BFDBFE;padding:2px 8px;border-radius:20px;white-space:nowrap}
        .prog-total-time{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:12px 16px;background:var(--accent-light);border:1.5px solid #BFDBFE;border-radius:10px}
        .prog-total-label{font-size:.78rem;font-weight:700;color:var(--accent)}
        .prog-total-value{font-size:1rem;font-weight:900;color:var(--accent);font-family:'Courier Prime',monospace}
        .prog-list-panel{width:100%;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
        .prog-list-header{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px;border-bottom:1px solid var(--border);flex-shrink:0}
        .prog-list-items{flex:1;overflow-y:auto;padding:8px}
        .prog-list-row{display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;cursor:pointer;margin-bottom:5px;border:1.5px solid var(--border);background:var(--panel);box-shadow:var(--shadow-sm);transition:all .12s;min-height:60px}
        .prog-list-row:hover{border-color:var(--accent)}
        .prog-list-row.active{border-color:var(--accent);background:var(--accent-light)}
        .prog-list-row-info{flex:1;min-width:0}
        .prog-list-row-title{font-size:.88rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .prog-list-row-meta{font-size:.7rem;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .prog-detail-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--panel);flex-shrink:0}
        .prog-detail-tab{flex:1;padding:13px 8px;text-align:center;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;color:var(--muted);border:none;background:transparent;border-bottom:2px solid transparent;transition:all .15s;min-height:48px}
        .prog-detail-tab:hover{color:var(--accent)}
        .prog-detail-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
        /* No overlapping on any screen size */
        .prog-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;width:100%}
        .prog-field input,.prog-field textarea,.prog-field select{width:100%;min-width:0;box-sizing:border-box}
        .prog-field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        @media(max-width:600px){
          .prog-field-row{grid-template-columns:1fr!important}
          .prog-item{flex-wrap:wrap}
          .prog-item-actions{margin-top:6px;width:100%;justify-content:flex-end;display:flex;gap:4px}
          .prog-duration-input{font-size:16px!important}
        }
        @media(max-width:900px){
          .prog-field input,.prog-field textarea,.prog-field select{font-size:16px!important;padding:11px 12px!important}
          .prog-select,.prog-input{padding:10px 12px!important;font-size:16px!important}
          .icon-btn{width:40px!important;height:40px!important}
          .pill-btn{padding:9px 14px!important}
          .prog-list-row{min-height:64px!important}
        }
      `}</style>

      {/* Unsaved changes banner */}
      {hasUnsaved && (
        <div style={{background:"#FEF9C3",borderBottom:"1px solid #FDE68A",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexShrink:0}}>
          <span style={{fontSize:".78rem",fontWeight:600,color:"#92400E"}}>⚠ Unsaved changes</span>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-ghost" style={{padding:"5px 12px",fontSize:".72rem"}} onClick={discardChanges}>Discard</button>
            <button className="btn-primary" style={{padding:"6px 16px",fontSize:".78rem"}} onClick={saveChanges}>💾 Save</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="page-header" style={{flexWrap:"wrap",gap:"8px"}}>
        <div className="prog-toolbar-left">
          {activeDraft && <span className="prog-sync-info">{activeDraft.title} · {songCount} song{songCount!==1?"s":""}</span>}
        </div>
        {activeDraft && <button className="btn-ghost" onClick={() => setPreviewMode(true)}>👁 Preview</button>}
      </div>

      {/* Desktop: 3-column */}
      <div className="desktop-prog">
        <style>{`
          .desktop-prog{display:none;flex:1;overflow:hidden}
          @media(min-width:768px){.desktop-prog{display:grid!important;grid-template-columns:200px 1fr 1fr;overflow:hidden}}
        `}</style>
        <ProgramList programs={programs} activeId={activeId} onSelect={handleSelectProgram} onCreate={createProgram} onDelete={deleteProgram} />
        <div style={{borderRight:"1px solid var(--border)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <ServiceDetails program={activeDraft} onUpdateField={updateField} />
        </div>
        <OrderOfService program={activeDraft} songs={songs} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem} onMoveItem={moveItem} />
      </div>

      {/* Mobile: list → detail */}
      <div className="mobile-prog">
        <style>{`
          .mobile-prog{flex:1;display:flex;flex-direction:column;overflow:hidden}
          @media(min-width:768px){.mobile-prog{display:none!important}}
        `}</style>
        {mobileView === "list" ? (
          <ProgramList programs={programs} activeId={activeId}
            onSelect={handleSelectProgram}
            onCreate={createProgram} onDelete={deleteProgram} />
        ) : (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:"var(--panel)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderBottom:"1px solid var(--border)"}}>
                <button className="btn-ghost" style={{padding:"7px 12px",fontSize:".78rem"}} onClick={() => setMobileView("list")}>← Programs</button>
                <span style={{fontWeight:700,fontSize:".85rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeDraft?.title}</span>
              </div>
              <div className="prog-detail-tabs">
                <button className={`prog-detail-tab ${mobileSection==="details"?"active":""}`} onClick={() => setMobileSection("details")}>Details</button>
                <button className={`prog-detail-tab ${mobileSection==="order"?"active":""}`} onClick={() => setMobileSection("order")}>Order of Service</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {mobileSection === "details"
                ? <ServiceDetails program={activeDraft} onUpdateField={updateField} />
                : <OrderOfService program={activeDraft} songs={songs} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem} onMoveItem={moveItem} />
              }
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewMode && activeDraft && (
        <ProgramPreviewModal
          program={activeDraft}
          songs={songs}
          onClose={() => setPreviewMode(false)}
        />
      )}
    </div>
  );
}
