import { useState } from "react";

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

function addMins(timeStr, mins) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`;
}

// ── 12-hour format ─────────────────────────────────────────────────────────────
export function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
}

// ── Program Preview Document ──────────────────────────────────────────────────
export function ProgramPreviewDoc({ program, songs }) {
  if (!program) return null;

  const totalMins = program.items.reduce((s, i) => s + (i.duration || 0), 0);
  const startTime = program.time || null;
  const endTime = startTime ? addMins(startTime, totalMins) : null;

  let runningMins = 0;
  const itemsWithTime = program.items.map(item => {
    const ts = startTime ? addMins(startTime, runningMins) : null;
    runningMins += item.duration || 0;
    return { ...item, timestamp: ts };
  });

  return (
    <div id="prog-preview-doc">
      <style>{`
        #prog-preview-doc {
          font-family: 'Inter', sans-serif;
          padding: 32px 28px 36px;
          max-width: 680px;
          margin: 0 auto;
          background: #ffffff;
        }
        .ppd-church { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .15em; color: #94A3B8; margin-bottom: 8px; }
        .ppd-title { font-size: 1.7rem; font-weight: 900; color: #2563EB; letter-spacing: -.02em; margin-bottom: 4px; line-height: 1.1; }
        .ppd-date { font-size: .88rem; color: #64748B; margin-bottom: 18px; }
        .ppd-time-banner { display: flex; align-items: center; justify-content: space-around; background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 14px; padding: 16px 24px; margin-bottom: 20px; }
        .ppd-time-item { text-align: center; }
        .ppd-time-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94A3B8; margin-bottom: 4px; }
        .ppd-time-val { font-size: 1.1rem; font-weight: 900; color: #1D4ED8; }
        .ppd-time-arrow { font-size: 1.6rem; color: #93C5FD; }
        .ppd-sermon { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; }
        .ppd-sermon-title { font-size: .98rem; font-weight: 700; margin-bottom: 3px; }
        .ppd-sermon-speaker { font-size: .78rem; color: #64748B; }
        .ppd-scripture { font-size: .82rem; color: #64748B; margin-bottom: 16px; font-style: italic; line-height: 1.5; }
        .ppd-divider { border: none; border-top: 2px solid #E2E8F0; margin: 18px 0; }
        .ppd-items { display: flex; flex-direction: column; gap: 8px; }
        .ppd-item { display: flex; align-items: stretch; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
        .ppd-item-ts { width: 76px; min-width: 76px; background: #F1F5F9; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 6px; border-right: 1px solid #E2E8F0; }
        .ppd-item-ts-val { font-size: .72rem; font-weight: 800; color: #2563EB; white-space: nowrap; }
        .ppd-item-ts-empty { font-size: .62rem; color: #CBD5E1; }
        .ppd-item-body { flex: 1; padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-left: 4px solid #2563EB; }
        .ppd-item-body.section { border-left-color: #7C3AED; }
        .ppd-item-left { flex: 1; min-width: 0; }
        .ppd-item-num { font-size: .65rem; color: #94A3B8; font-weight: 700; margin-bottom: 2px; }
        .ppd-item-name { font-size: .92rem; font-weight: 700; color: #0F172A; }
        .ppd-item-sub { font-size: .75rem; color: #64748B; margin-top: 2px; }
        .ppd-item-dur { font-size: .72rem; font-weight: 700; color: #2563EB; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .ppd-total { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; padding: 14px 20px; background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 12px; }
        .ppd-total-label { font-size: .82rem; font-weight: 700; color: #2563EB; }
        .ppd-total-val { font-size: 1rem; font-weight: 900; color: #1D4ED8; font-family: 'Courier Prime', monospace; }
        .ppd-notes { font-size: .8rem; color: #64748B; line-height: 1.7; margin-top: 14px; }
      `}</style>

      <div className="ppd-church">Christian Family Church</div>
      <div className="ppd-title">{program.title}</div>
      <div className="ppd-date">{formatDate(program.date)}</div>

      {/* Start → Target End banner at top */}
      {startTime && (
        <div className="ppd-time-banner">
          <div className="ppd-time-item">
            <div className="ppd-time-label">▶ Start</div>
            <div className="ppd-time-val">{fmtTime(startTime)}</div>
          </div>
          <div className="ppd-time-arrow">→</div>
          <div className="ppd-time-item">
            <div className="ppd-time-label">⏱ Duration</div>
            <div className="ppd-time-val">{formatDuration(totalMins)}</div>
          </div>
          {endTime && totalMins > 0 && (
            <>
              <div className="ppd-time-arrow">→</div>
              <div className="ppd-time-item">
                <div className="ppd-time-label">🎯 Target End</div>
                <div className="ppd-time-val">{fmtTime(endTime)}</div>
              </div>
            </>
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
        <div className="ppd-scripture">
          <strong style={{fontStyle:"normal",color:"#334155"}}>Scripture: </strong>{program.scripture}
        </div>
      )}

      <div className="ppd-divider" />

      <div className="ppd-items">
        {itemsWithTime.map((item, i) => {
          const song = item.type === "song" ? songs.find(s => s.id === item.songId) : null;
          const name = item.type === "song" ? (song?.title || "—") : (item.label || "—");
          const sub = item.type === "song" ? song?.artist : (item.activity || item.notes);
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
                  {item.inCharge && <div className="ppd-item-sub">👤 {item.inCharge}</div>}
                </div>
                {item.duration ? <span className="ppd-item-dur">{item.duration} min</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total duration only — no Target Finish at bottom */}
      {totalMins > 0 && (
        <div className="ppd-total">
          <span className="ppd-total-label">⏱ Total Duration</span>
          <span className="ppd-total-val">{formatDuration(totalMins)}</span>
        </div>
      )}

      {program.notes && (
        <><div className="ppd-divider" /><div className="ppd-notes"><strong>Notes:</strong> {program.notes}</div></>
      )}
    </div>
  );
}

// ── Preview Modal with Download ───────────────────────────────────────────────
export function ProgramPreviewModal({ program, songs, onClose }) {
  const [downloading, setDownloading] = useState(false);
  if (!program) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = document.getElementById("prog-preview-doc");
      if (!el) return;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
      });
      const url = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${program.title.replace(/\s+/g,"-")}-${program.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
            {downloading ? "⏳ Saving…" : "⬇ Download"}
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          <ProgramPreviewDoc program={program} songs={songs} />
        </div>
      </div>
    </div>
  );
}
