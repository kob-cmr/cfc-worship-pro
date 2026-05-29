// ── Shared Program Preview component ─────────────────────────────────────────
// Used by: Home (current service), Calendar (event program), Program tab

export function formatDuration(mins) {
  if (!mins) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
}

export function ProgramPreviewDoc({ program, songs }) {
  if (!program) return null;
  const totalMins = program.items.reduce((s, i) => s + (i.duration || 0), 0);
  return (
    <div className="preview-doc" id="prog-preview-doc">
      <div className="preview-church">Christian Family Church</div>
      <div className="preview-title">{program.title}</div>
      <div className="preview-date">
        {formatDate(program.date)}{program.time ? ` · ${program.time}` : ""}
      </div>
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
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div>
                    <span className="preview-item-song">{song.title}</span>
                    <span className="preview-item-meta"> — {song.artist}</span>
                  </div>
                  {item.duration ? <span className="prev-dur">{item.duration} min</span> : null}
                </div>
              ) : (
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div>
                    <span className="preview-item-section">{item.label}</span>
                    {item.notes && <span className="preview-item-note"> ({item.notes})</span>}
                  </div>
                  {item.duration ? <span className="prev-dur">{item.duration} min</span> : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalMins > 0 && (
        <div className="prog-total-time" style={{marginTop:16}}>
          <span className="prog-total-label">⏱ Total Duration</span>
          <span className="prog-total-value">{formatDuration(totalMins)}</span>
        </div>
      )}
      {program.notes && (
        <><div className="preview-divider" /><div className="preview-notes"><strong>Notes:</strong> {program.notes}</div></>
      )}
    </div>
  );
}

// ── Full-screen preview modal with Download ───────────────────────────────────
export function ProgramPreviewModal({ program, songs, onClose }) {
  if (!program) return null;

  const handleDownload = () => {
    const el = document.getElementById("prog-preview-doc");
    if (!el) return;
    const content = el.innerText;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${program.title.replace(/\s+/g,"-")}-${program.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="prog-preview-modal-overlay" onClick={onClose}>
      <div className="prog-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="prog-preview-modal-bar">
          <button className="btn-ghost" style={{padding:"7px 14px",fontSize:".8rem"}} onClick={onClose}>← Back</button>
          <div style={{fontWeight:700,fontSize:".88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 8px"}}>{program.title}</div>
          <button className="btn-primary" style={{fontSize:".78rem",padding:"8px 16px"}} onClick={handleDownload}>⬇ Download</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          <ProgramPreviewDoc program={program} songs={songs} />
        </div>
      </div>
    </div>
  );
}
