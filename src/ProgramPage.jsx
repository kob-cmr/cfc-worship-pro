import { useState } from "react";

const SECTION_PRESETS = [
  "Welcome & Announcements","Opening Prayer","Scripture Reading",
  "Sermon","Offering","Communion","Closing Prayer","Benediction",
  "Special Number","Testimony","Children's Moment","Greeting Time",
];

function ItemRow({ item, songs, index, total, onUpdate, onDelete, onMove, setlist, setSetlist }) {
  const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;
  const inSetlist = item.type === "song" && setlist.includes(item.songId);
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
              onChange={e => {
                const id = Number(e.target.value);
                onUpdate({ ...item, songId: id });
                if (id && !setlist.includes(id)) setSetlist(sl => [...sl, id]);
              }}>
              <option value="">— choose a song —</option>
              {songs.map(s => <option key={s.id} value={s.id}>{s.title} ({s.key})</option>)}
            </select>
            {song && <span className="prog-song-meta">{song.artist} · Key of {song.key}</span>}
            {song && !inSetlist && (
              <button className="pill-btn green" onClick={() => setSetlist(sl => [...sl, song.id])}>+ Add to Setlist</button>
            )}
            {song && inSetlist && <span className="pill-badge">✓ In Setlist</span>}
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

export default function ProgramPage({ songs, program, setProgram, setlist, setSetlist }) {
  const [previewMode, setPreviewMode] = useState(false);
  const [mobileSection, setMobileSection] = useState("details"); // "details" | "order"

  const updateField = (k, v) => setProgram(p => ({ ...p, [k]: v }));

  const addItem = (type) => {
    const newItem = type === "song"
      ? { id: Date.now().toString(), type: "song", songId: null }
      : { id: Date.now().toString(), type: "section", label: "", notes: "" };
    setProgram(p => ({ ...p, items: [...p.items, newItem] }));
  };

  const updateItem = (updated) => {
    setProgram(p => ({ ...p, items: p.items.map(i => i.id === updated.id ? updated : i) }));
  };

  const deleteItem = (id) => {
    setProgram(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
  };

  const moveItem = (index, dir) => {
    setProgram(p => {
      const items = [...p.items];
      const target = index + dir;
      if (target < 0 || target >= items.length) return p;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...p, items };
    });
  };

  const syncToSetlist = () => {
    const songIds = program.items.filter(i => i.type === "song" && i.songId).map(i => i.songId);
    setSetlist(songIds);
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const songItems = program.items.filter(i => i.type === "song" && i.songId);

  const ServiceDetails = () => (
    <div className="prog-details">
      <div className="prog-section-title">Service Details</div>
      <div className="prog-field">
        <label>Service Title</label>
        <input value={program.title} onChange={e => updateField("title", e.target.value)} placeholder="Sunday Morning Worship" />
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
      <div className="prog-section-title" style={{marginTop:"16px"}}>Setlist Summary</div>
      <div className="setlist-summary">
        {setlist.length === 0 && <div className="empty-sidebar">No songs in setlist yet.</div>}
        {setlist.map((id, i) => {
          const s = songs.find(x => x.id === id);
          return s ? (
            <div key={id} className="summary-row">
              <span className="summary-num">{i+1}</span>
              <span className="summary-title">{s.title}</span>
              <span className="summary-key">{s.key}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );

  const OrderOfService = () => (
    <div className="prog-order">
      <div className="prog-section-header">
        <div className="prog-section-title">Order of Service</div>
        <div style={{display:"flex",gap:"6px"}}>
          <button className="pill-btn" onClick={() => addItem("section")}>+ Section</button>
          <button className="pill-btn accent" onClick={() => addItem("song")}>+ Song</button>
        </div>
      </div>
      {program.items.length === 0 && (
        <div className="empty-state" style={{height:"180px"}}>
          <div className="empty-icon">📋</div>
          <div className="empty-text">No items yet</div>
          <div className="empty-sub">Add a section or song above</div>
        </div>
      )}
      <div className="prog-items-list">
        {program.items.map((item, i) => (
          <ItemRow key={item.id} item={item} songs={songs} index={i}
            total={program.items.length} onUpdate={updateItem}
            onDelete={deleteItem} onMove={moveItem}
            setlist={setlist} setSetlist={setSetlist} />
        ))}
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="preview-wrap">
        <div className="preview-toolbar">
          <button className="btn-ghost" onClick={() => setPreviewMode(false)}>← Back</button>
          <button className="btn-primary" onClick={() => window.print()}>🖨 Print</button>
        </div>
        <div className="preview-doc">
          <div className="preview-church">Worship Service Program</div>
          <div className="preview-title">{program.title || "Sunday Service"}</div>
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
                  {item.type === "song" && song ? (
                    <div><span className="preview-item-song">{song.title}</span><span className="preview-item-meta"> — {song.artist}</span></div>
                  ) : item.type === "section" ? (
                    <div><span className="preview-item-section">{item.label}</span>{item.notes && <span className="preview-item-note"> ({item.notes})</span>}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {program.notes && (<><div className="preview-divider" /><div className="preview-notes"><strong>Notes:</strong> {program.notes}</div></>)}
        </div>
      </div>
    );
  }

  return (
    <div className="program-wrap">
      <style>{`
        @media (max-width: 900px) {
          .prog-details { padding: 14px !important; }
          .prog-order { padding: 14px 16px !important; }
          .prog-field input, .prog-field textarea, .prog-field select { padding: 11px 12px !important; font-size: 0.88rem !important; }
          .pill-btn { padding: 10px 16px !important; font-size: 0.75rem !important; min-height: 42px; }
          .pitem { padding: 14px !important; }
          .prog-select { padding: 10px 12px !important; font-size: 0.85rem !important; min-height: 44px; }
          .prog-input { padding: 10px 12px !important; font-size: 0.85rem !important; min-height: 44px; }
          .icon-btn { width: 40px !important; height: 40px !important; font-size: 1rem !important; }
          .summary-row { min-height: 44px; }
          .sidebar-tab { padding: 14px 8px !important; font-size: 0.72rem !important; min-height: 50px; }
          .btn-ghost, .btn-primary { padding: 11px 18px !important; font-size: 0.8rem !important; min-height: 44px; }
        }
      `}</style>
      {/* Toolbar */}
      <div className="page-header" style={{flexWrap:"wrap",gap:"8px"}}>
        <div className="prog-toolbar-left">
          <span className="prog-sync-info">{songItems.length} song{songItems.length !== 1 ? "s" : ""} in program</span>
          <button className="pill-btn accent" onClick={syncToSetlist}>↕ Sync to Setlist</button>
        </div>
        <button className="btn-ghost" onClick={() => setPreviewMode(true)}>👁 Preview / Print</button>
      </div>

      {/* Desktop: side by side */}
      <div className="program-body desktop-only">
        <ServiceDetails />
        <OrderOfService />
      </div>

      {/* Mobile: tabbed */}
      <div className="mobile-only" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div className="sidebar-tabs">
          <button className={`sidebar-tab ${mobileSection==="details"?"active":""}`} onClick={() => setMobileSection("details")}>
            Service Details
          </button>
          <button className={`sidebar-tab ${mobileSection==="order"?"active":""}`} onClick={() => setMobileSection("order")}>
            Order of Service
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {mobileSection === "details" ? <ServiceDetails /> : <OrderOfService />}
        </div>
      </div>
    </div>
  );
}
