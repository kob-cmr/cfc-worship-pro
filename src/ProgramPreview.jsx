import { useRef, useState } from "react";

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

// ── Add minutes to a HH:MM string ────────────────────────────────────────────
function addMins(timeStr, mins) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`;
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
}

// ── Program Preview Document ──────────────────────────────────────────────────
export function ProgramPreviewDoc({ program, songs, forExport = false }) {
  if (!program) return null;

  const totalMins = program.items.reduce((s, i) => s + (i.duration || 0), 0);
  const startTime = program.time || null;
  const endTime = startTime ? addMins(startTime, totalMins) : null;

  // Build timestamp sequence
  let runningMins = 0;
  const itemsWithTime = program.items.map(item => {
    const ts = startTime ? addMins(startTime, runningMins) : null;
    runningMins += item.duration || 0;
    return { ...item, timestamp: ts };
  });

  const docStyle = forExport ? {
    background: "#ffffff",
    padding: "36px 40px",
    maxWidth: "600px",
    fontFamily: "Inter, sans-serif",
    color: "#0F172A",
    width: "600px",
  } : {};

  return (
    <div id="prog-preview-doc" style={docStyle}>
      <style>{`
        #prog-preview-doc { font-family: 'Inter', sans-serif; }
        .ppd-header { margin-bottom: 20px; }
        .ppd-church { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .15em; color: #94A3B8; margin-bottom: 6px; }
        .ppd-title { font-size: 1.5rem; font-weight: 900; color: #2563EB; letter-spacing: -.02em; margin-bottom: 3px; }
        .ppd-date { font-size: .82rem; color: #64748B; margin-bottom: 10px; }
        .ppd-time-banner { display: flex; align-items: center; justify-content: space-between; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 10px 16px; margin-bottom: 14px; }
        .ppd-time-item { text-align: center; }
        .ppd-time-label { font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94A3B8; margin-bottom: 2px; }
        .ppd-time-val { font-size: .95rem; font-weight: 900; color: #1D4ED8; }
        .ppd-time-arrow { font-size: 1.2rem; color: #93C5FD; }
        .ppd-sermon { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
        .ppd-sermon-title { font-size: .92rem; font-weight: 700; margin-bottom: 2px; }
        .ppd-sermon-speaker { font-size: .75rem; color: #64748B; }
        .ppd-scripture { font-size: .78rem; color: #64748B; margin-bottom: 12px; font-style: italic; }
        .ppd-divider { border: none; border-top: 2px solid #E2E8F0; margin: 14px 0; }
        .ppd-items { display: flex; flex-direction: column; gap: 6px; }
        .ppd-item { display: flex; align-items: stretch; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; background: #ffffff; }
        .ppd-item-ts { width: 66px; min-width: 66px; background: #F1F5F9; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 4px; border-right: 1px solid #E2E8F0; }
        .ppd-item-ts-val { font-size: .7rem; font-weight: 800; color: #2563EB; white-space: nowrap; }
        .ppd-item-ts-empty { font-size: .6rem; color: #CBD5E1; }
        .ppd-item-body { flex: 1; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; border-left: 3px solid #2563EB; }
        .ppd-item-body.section { border-left-color: #7C3AED; }
        .ppd-item-left { flex: 1; min-width: 0; }
        .ppd-item-num { font-size: .62rem; color: #94A3B8; font-weight: 700; margin-bottom: 1px; }
        .ppd-item-name { font-size: .85rem; font-weight: 700; color: #0F172A; }
        .ppd-item-sub { font-size: .7rem; color: #64748B; margin-top: 1px; }
        .ppd-item-dur { font-size: .68rem; font-weight: 700; color: #2563EB; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 2px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .ppd-total { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding: 12px 16px; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 10px; }
        .ppd-total-label { font-size: .78rem; font-weight: 700; color: #2563EB; }
        .ppd-total-val { font-size: .95rem; font-weight: 900; color: #1D4ED8; font-family: 'Courier Prime', monospace; }
        .ppd-finish { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding: 10px 16px; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 10px; }
        .ppd-finish-label { font-size: .78rem; font-weight: 700; color: #059669; }
        .ppd-finish-val { font-size: .95rem; font-weight: 900; color: #047857; }
        .ppd-notes { font-size: .75rem; color: #64748B; line-height: 1.6; margin-top: 12px; }
      `}</style>

      <div className="ppd-header">
        <div className="ppd-church">Christian Family Church</div>
        <div className="ppd-title">{program.title}</div>
        <div className="ppd-date">{formatDate(program.date)}</div>
      </div>

      {/* Start / End time banner */}
      {startTime && (
        <div className="ppd-time-banner">
          <div className="ppd-time-item">
            <div className="ppd-time-label">Start</div>
            <div className="ppd-time-val">{fmtTime(startTime)}</div>
          </div>
          <div className="ppd-time-arrow">→</div>
          {endTime && totalMins > 0 ? (
            <div className="ppd-time-item">
              <div className="ppd-time-label">Target End</div>
              <div className="ppd-time-val">{fmtTime(endTime)}</div>
            </div>
          ) : (
            <div className="ppd-time-item">
              <div className="ppd-time-label">Duration</div>
              <div className="ppd-time-val">{formatDuration(totalMins)}</div>
            </div>
          )}
        </div>
      )}

      {(program.speaker || program.sermonTitle) && (
        <div className="ppd-sermon">
          {program.sermonTitle && <div className="ppd-sermon-title">"{program.sermonTitle}"</div>}
          {program.speaker && <div className="ppd-sermon-speaker">Speaker: {program.speaker}</div>}
        </div>
      )}
      {program.scripture && (
        <div className="ppd-scripture"><strong style={{fontStyle:"normal",color:"#334155"}}>Scripture:</strong> {program.scripture}</div>
      )}

      <div className="ppd-divider" />

      <div className="ppd-items">
        {itemsWithTime.map((item, i) => {
          const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;
          const name = item.type === "song" ? (song?.title || "—") : (item.label || "—");
          const sub = item.type === "song" ? song?.artist : item.notes;
          return (
            <div key={item.id} className="ppd-item">
              <div className="ppd-item-ts">
                {item.timestamp
                  ? <span className="ppd-item-ts-val">{fmtTime(item.timestamp)}</span>
                  : <span className="ppd-item-ts-empty">—</span>}
              </div>
              <div className={`ppd-item-body ${item.type}`}>
                <div className="ppd-item-left">
                  <div className="ppd-item-num">#{i+1}</div>
                  <div className="ppd-item-name">{name}</div>
                  {sub && <div className="ppd-item-sub">{sub}</div>}
                </div>
                {item.duration ? <span className="ppd-item-dur">{item.duration} min</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {totalMins > 0 && (
        <div className="ppd-total">
          <span className="ppd-total-label">⏱ Total Duration</span>
          <span className="ppd-total-val">{formatDuration(totalMins)}</span>
        </div>
      )}
      {endTime && totalMins > 0 && (
        <div className="ppd-finish">
          <span className="ppd-finish-label">🎯 Target Finish</span>
          <span className="ppd-finish-val">{fmtTime(endTime)}</span>
        </div>
      )}
      {program.notes && (
        <><div className="ppd-divider" /><div className="ppd-notes"><strong>Notes:</strong> {program.notes}</div></>
      )}
    </div>
  );
}

// ── Full-screen preview modal with JPG Download ───────────────────────────────
export function ProgramPreviewModal({ program, songs, onClose }) {
  const [downloading, setDownloading] = useState(false);
  if (!program) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      const el = document.getElementById("prog-preview-doc");
      if (!el) return;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const url = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${program.title.replace(/\s+/g,"-")}-${program.date}.jpg`;
      a.click();
    } catch (e) {
      console.error("Download failed:", e);
      alert("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="prog-preview-modal-overlay" onClick={onClose}>
      <div className="prog-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="prog-preview-modal-bar">
          <button className="btn-ghost" style={{padding:"7px 14px",fontSize:".8rem"}} onClick={onClose}>← Back</button>
          <div style={{fontWeight:700,fontSize:".88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 8px"}}>{program.title}</div>
          <button className="btn-primary" style={{fontSize:".78rem",padding:"8px 16px",opacity:downloading?0.7:1}}
            onClick={handleDownload} disabled={downloading}>
            {downloading ? "⏳ Saving…" : "⬇ Download JPG"}
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          <ProgramPreviewDoc program={program} songs={songs} />
        </div>
      </div>
    </div>
  );
}
