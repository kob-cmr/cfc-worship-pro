import { useState } from "react";

const SECTION_PRESETS = [
  "Pre-Service","Welcome & Announcements","Opening Prayer","Scripture Reading",
  "Sermon","Offering","Communion","Closing Prayer","Benediction",
  "Special Number","Testimony","Children's Moment","Greeting Time","Dismissal",
];

const EVENT_TYPES = [
  "Sunday Worship Service",
  "Wednesday Prayer Meeting",
  "Youth Service",
  "Special Event",
  "Fellowship",
  "Outreach",
  "Other",
];

function newProgram(overrides = {}) {
  return {
    id: `prog-${Date.now()}`,
    title: "Sunday Worship Service",
    eventType: "Sunday Worship Service",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    speaker: "",
    sermonTitle: "",
    scripture: "",
    notes: "",
    items: [],
    ...overrides,
  };
}

// ── Item Row ──────────────────────────────────────────────────────────────────
function ItemRow({ item, songs, index, total, onUpdate, onDelete, onMove }) {
  const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;
  return (
    <div className={`prog-item ${item.type}`}>
      <div className="prog-item-left">
        <span className="prog-num">{index + 1}</span>
        <span className="prog-type-badge">{item.type === "song" ? "🎵" : "📋"}</span>
      </div>
      <div className="prog-item-body">
        {item.type === "song" ? (
          <div className="prog-song-info">
            <select className="prog-select" value={item.songId || ""}
              onChange={e => onUpdate({ ...item, songId: Number(e.target.value) || null })}>
              <option value="">— choose a song —</option>
              {songs.map(s => <option key={s.id} value={s.id}>{s.title} ({s.key})</option>)}
            </select>
            {song && <span className="prog-song-meta">{song.artist} · Key of {song.key}</span>}
          </div>
        ) : (
          <div className="prog-section-info">
            <input className="prog-input" value={item.label || ""}
              onChange={e => onUpdate({ ...item, label: e.target.value })}
              placeholder="Section name…" list="section-presets" />
            <datalist id="section-presets">
              {SECTION_PRESETS.map(p => <option key={p} value={p} />)}
            </datalist>
            <input className="prog-input prog-input-sm" value={item.notes || ""}
              onChange={e => onUpdate({ ...item, notes: e.target.value })}
              placeholder="Notes (optional)" />
          </div>
        )}
      </div>
      <div className="prog-item-actions">
        <button className="icon-btn" disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
        <button className="icon-btn" disabled={index === total - 1} onClick={() => onMove(index, 1)}>↓</button>
        <button className="icon-btn danger" onClick={() => onDelete(item.id)}>✕</button>
      </div>
    </div>
  );
}

// ── Program List (left panel) ─────────────────────────────────────────────────
function ProgramList({ programs, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="prog-list-panel">
      <div className="prog-list-header">
        <div className="prog-section-title" style={{margin:0}}>Programs</div>
        <button className="pill-btn accent" onClick={onCreate}>+ New</button>
      </div>
      <div className="prog-list-items">
        {programs.length === 0 && (
          <div className="empty-sidebar">No programs yet.<br/>Tap + New to create one.</div>
        )}
        {[...programs].reverse().map(p => (
          <div key={p.id}
            className={`prog-list-row ${p.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(p.id)}>
            <div className="prog-list-row-info">
              <div className="prog-list-row-title">{p.title}</div>
              <div className="prog-list-row-meta">
                {p.eventType && p.eventType !== p.title ? p.eventType + " · " : ""}{p.date}
              </div>
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

// ── Main ProgramPage ──────────────────────────────────────────────────────────
export default function ProgramPage({ songs, programs, setPrograms }) {
  const [activeId, setActiveId] = useState(programs[programs.length - 1]?.id || null);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // "list" | "detail"
  const [mobileSection, setMobileSection] = useState("details");

  const program = programs.find(p => p.id === activeId) || null;

  const updateProgram = (updater) => {
    setPrograms(ps => ps.map(p => p.id === activeId ? (typeof updater === "function" ? updater(p) : { ...p, ...updater }) : p));
  };

  const updateField = (k, v) => updateProgram(p => ({ ...p, [k]: v }));

  const createProgram = () => {
    const np = newProgram();
    setPrograms(ps => [...ps, np]);
    setActiveId(np.id);
    setMobileView("detail");
  };

  const deleteProgram = (id) => {
    const remaining = programs.filter(p => p.id !== id);
    setPrograms(remaining);
    if (activeId === id) setActiveId(remaining[remaining.length - 1]?.id || null);
  };

  const addItem = (type) => {
    const item = type === "song"
      ? { id: Date.now().toString(), type: "song", songId: null }
      : { id: Date.now().toString(), type: "section", label: "", notes: "" };
    updateProgram(p => ({ ...p, items: [...p.items, item] }));
  };

  const updateItem = (updated) => {
    updateProgram(p => ({ ...p, items: p.items.map(i => i.id === updated.id ? updated : i) }));
  };

  const deleteItem = (id) => {
    updateProgram(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  };

  const moveItem = (index, dir) => {
    updateProgram(p => {
      const items = [...p.items];
      const t = index + dir;
      if (t < 0 || t >= items.length) return p;
      [items[index], items[t]] = [items[t], items[index]];
      return { ...p, items };
    });
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  };

  // ── Preview ─────────────────────────────────────────────────────────────────
  if (previewMode && program) return (
    <div className="preview-wrap">
      <div className="preview-toolbar">
        <button className="btn-ghost" onClick={() => setPreviewMode(false)}>← Back</button>
        <div style={{fontWeight:700,fontSize:"0.85rem"}}>{program.title}</div>
        <button className="btn-primary" onClick={() => window.print()}>🖨 Print</button>
      </div>
      <div className="preview-doc">
        <div className="preview-church">Worship Service Program</div>
        <div className="preview-title">{program.title}</div>
        <div className="preview-date">{formatDate(program.date)}{program.time ? ` · ${program.time}` : ""}</div>
        {(program.speaker || program.sermonTitle) && (
          <div className="preview-sermon">
            {program.sermonTitle && <div className="preview-sermon-title">"{program.sermonTitle}"</div>}
            {program.speaker && <div className="preview-speaker">Speaker: {program.speaker}</div>}
          </div>
        )}
        {program.scripture && (
          <div className="preview-scripture">
            <span className="preview-scripture-label">Scripture: </span>{program.scripture}
          </div>
        )}
        <div className="preview-divider" />
        <div className="preview-items">
          {program.items.map((item, i) => {
            const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;
            return (
              <div key={item.id} className={`preview-item ${item.type}`}>
                <span className="preview-item-num">{i + 1}.</span>
                {item.type === "song" && song
                  ? <div><span className="preview-item-song">{song.title}</span><span className="preview-item-meta"> — {song.artist}</span></div>
                  : <div><span className="preview-item-section">{item.label}</span>{item.notes && <span className="preview-item-note"> ({item.notes})</span>}</div>}
              </div>
            );
          })}
        </div>
        {program.notes && (<><div className="preview-divider" /><div className="preview-notes"><strong>Notes:</strong> {program.notes}</div></>)}
      </div>
    </div>
  );

  // ── Service Details panel ────────────────────────────────────────────────────
  const ServiceDetails = () => !program ? (
    <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No program selected</div></div>
  ) : (
    <div className="prog-details">
      <div className="prog-section-title">Service Details</div>
      <div className="prog-field">
        <label>Event Type</label>
        <select value={program.eventType || ""} onChange={e => {
          updateField("eventType", e.target.value);
          if (!program.title || EVENT_TYPES.includes(program.title)) updateField("title", e.target.value);
        }}>
          <option value="">Select type…</option>
          {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="prog-field">
        <label>Program Title</label>
        <input value={program.title} onChange={e => updateField("title", e.target.value)} placeholder="e.g. Sunday Morning Worship" />
      </div>
      <div className="prog-field-row">
        <div className="prog-field">
          <label>Date</label>
          <input type="date" value={program.date} onChange={e => updateField("date", e.target.value)} />
        </div>
        <div className="prog-field">
          <label>Time</label>
          <input type="time" value={program.time} onChange={e => updateField("time", e.target.value)} />
        </div>
      </div>
      <div className="prog-field">
        <label>Speaker / Preacher</label>
        <input value={program.speaker} onChange={e => updateField("speaker", e.target.value)} placeholder="Pastor name" />
      </div>
      <div className="prog-field">
        <label>Sermon Title</label>
        <input value={program.sermonTitle} onChange={e => updateField("sermonTitle", e.target.value)} placeholder="Sermon title" />
      </div>
      <div className="prog-field">
        <label>Scripture Reading</label>
        <input value={program.scripture} onChange={e => updateField("scripture", e.target.value)} placeholder="e.g. John 3:16-21" />
      </div>
      <div className="prog-field">
        <label>Team Notes</label>
        <textarea value={program.notes} onChange={e => updateField("notes", e.target.value)}
          rows={3} placeholder="Internal notes for the worship team…" />
      </div>
    </div>
  );

  // ── Order of Service panel ───────────────────────────────────────────────────
  const OrderOfService = () => !program ? null : (
    <div className="prog-order">
      <div className="prog-section-header">
        <div className="prog-section-title">Order of Service</div>
        <div style={{display:"flex",gap:"6px"}}>
          <button className="pill-btn" onClick={() => addItem("section")}>+ Section</button>
          <button className="pill-btn accent" onClick={() => addItem("song")}>+ Song</button>
        </div>
      </div>
      {program.items.length === 0 && (
        <div className="empty-state" style={{height:"160px"}}>
          <div className="empty-icon">📋</div>
          <div className="empty-text">No items yet</div>
          <div className="empty-sub">Add a section or song above</div>
        </div>
      )}
      <div className="prog-items-list">
        {program.items.map((item, i) => (
          <ItemRow key={item.id} item={item} songs={songs} index={i}
            total={program.items.length}
            onUpdate={updateItem} onDelete={deleteItem} onMove={moveItem} />
        ))}
      </div>
    </div>
  );

  const songCount = program?.items.filter(i => i.type === "song" && i.songId).length || 0;

  return (
    <div className="program-wrap">
      <style>{`
        .prog-list-panel { width: 100%; background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .prog-list-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 10px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .prog-list-items { flex: 1; overflow-y: auto; padding: 8px; }
        .prog-list-row { display: flex; align-items: center; gap: 8px; padding: 12px 12px; border-radius: 10px; cursor: pointer; margin-bottom: 5px; border: 1.5px solid var(--border); background: var(--panel); box-shadow: var(--shadow-sm); transition: all .12s; min-height: 60px; }
        .prog-list-row:hover { border-color: var(--accent); }
        .prog-list-row.active { border-color: var(--accent); background: var(--accent-light); }
        .prog-list-row-info { flex: 1; min-width: 0; }
        .prog-list-row-title { font-size: 0.88rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .prog-list-row-meta { font-size: 0.7rem; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .prog-detail-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .prog-detail-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--panel); flex-shrink: 0; }
        .prog-detail-tab { flex: 1; padding: 13px 8px; text-align: center; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; color: var(--muted); border: none; background: transparent; border-bottom: 2px solid transparent; transition: all .15s; min-height: 48px; }
        .prog-detail-tab:hover { color: var(--accent); }
        .prog-detail-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .prog-detail-body { flex: 1; overflow: hidden; display: flex; }
        @media (max-width: 900px) {
          .prog-field input, .prog-field textarea, .prog-field select { padding: 11px 12px !important; font-size: 0.88rem !important; min-height: 44px; }
          .prog-select, .prog-input { padding: 10px 12px !important; font-size: 0.85rem !important; min-height: 44px; }
          .icon-btn { width: 40px !important; height: 40px !important; }
          .pill-btn { padding: 9px 14px !important; }
          .prog-list-row { min-height: 64px !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="page-header" style={{flexWrap:"wrap",gap:"8px"}}>
        <div className="prog-toolbar-left">
          {program && <span className="prog-sync-info">{program.title} · {songCount} song{songCount!==1?"s":""}</span>}
        </div>
        {program && <button className="btn-ghost" onClick={() => setPreviewMode(true)}>👁 Preview / Print</button>}
      </div>

      {/* ── Desktop: 3-column ── */}
      <div style={{flex:1,overflow:"hidden",display:"none"}} className="desktop-prog">
        <style>{`.desktop-prog { display: none !important; } @media (min-width: 768px) { .desktop-prog { display: grid !important; grid-template-columns: 220px 1fr 1fr; overflow: hidden; } }`}</style>
        <ProgramList programs={programs} activeId={activeId} onSelect={setActiveId} onCreate={createProgram} onDelete={deleteProgram} />
        <div style={{borderRight:"1px solid var(--border)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <ServiceDetails />
        </div>
        <OrderOfService />
      </div>

      {/* ── Mobile: list → detail ── */}
      <div className="mobile-prog" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <style>{`@media (min-width: 768px) { .mobile-prog { display: none !important; } }`}</style>
        {mobileView === "list" ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <ProgramList programs={programs} activeId={activeId}
              onSelect={id => { setActiveId(id); setMobileView("detail"); }}
              onCreate={createProgram}
              onDelete={deleteProgram} />
          </div>
        ) : (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Back + tabs */}
            <div style={{background:"var(--panel)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderBottom:"1px solid var(--border)"}}>
                <button className="btn-ghost" style={{padding:"7px 12px",fontSize:"0.78rem"}} onClick={() => setMobileView("list")}>← Programs</button>
                <span style={{fontWeight:700,fontSize:"0.85rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{program?.title}</span>
              </div>
              <div className="prog-detail-tabs">
                <button className={`prog-detail-tab ${mobileSection==="details"?"active":""}`} onClick={() => setMobileSection("details")}>Details</button>
                <button className={`prog-detail-tab ${mobileSection==="order"?"active":""}`} onClick={() => setMobileSection("order")}>Order of Service</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {mobileSection === "details" ? <ServiceDetails /> : <OrderOfService />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
