import { useState } from "react";
import SetlistPage from "./SetlistPage.jsx";
import ProgramPage from "./ProgramPage.jsx";
import { SAMPLE_SONGS, SAMPLE_PROGRAM } from "./shared.js";

const CFCLogo = ({ size = 32 }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="32" y="0" width="16" height="20" fill="#E8621A"/>
    <rect x="20" y="14" width="40" height="12" fill="#E8621A"/>
    <polygon points="40,30 72,55 72,115 8,115 8,55" fill="none" stroke="#E8621A" strokeWidth="10" strokeLinejoin="round"/>
    <rect x="28" y="70" width="24" height="45" fill="#E8621A"/>
  </svg>
);

export default function App() {
  const [songs, setSongs] = useState(SAMPLE_SONGS);
  const [setlist, setSetlist] = useState([1, 2, 3]);
  const [program, setProgram] = useState(SAMPLE_PROGRAM);
  const [page, setPage] = useState("setlist");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Lato:wght@300;400;700&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F5F0E8;
          --panel: #FFFFFF;
          --border: #E8E0D0;
          --accent: #E8621A;
          --accent2: #FF7A30;
          --accent-light: rgba(232,98,26,0.08);
          --text: #1A1A1A;
          --muted: #888070;
          --chord: #E8621A;
          --lyric: #3A3530;
          --danger: #DC3545;
          --green: #2E7D4F;
          --blue: #2563EB;
          --shadow-sm: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
        }

        body { background: var(--bg); color: var(--text); font-family: 'Lato', sans-serif; min-height: 100vh; }

        .shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        .topbar {
          background: var(--panel);
          box-shadow: var(--shadow-sm);
          display: flex; align-items: center; gap: 12px; height: 58px; flex-shrink: 0;
          padding: 0 24px; z-index: 10;
        }
        .topbar-logo {
          display: flex; align-items: center; gap: 10px; flex: 1;
        }
        .topbar-logo-text {
          font-family: 'Montserrat', sans-serif; font-size: 1.05rem; font-weight: 900;
          color: var(--text); letter-spacing: -0.01em;
        }
        .topbar-logo-text span { color: var(--accent); }
        .topbar-logo-sub { color: var(--muted); font-weight: 400; font-size: 0.72rem; margin-left: 2px; }

        .nav-tabs { display: flex; gap: 4px; background: var(--bg); padding: 3px; border-radius: 10px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); }
        .nav-tab {
          padding: 7px 20px; border-radius: 8px; border: none; cursor: pointer;
          font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          background: transparent; color: var(--muted); transition: all 0.15s;
        }
        .nav-tab:hover { background: rgba(232,98,26,0.08); color: var(--accent); }
        .nav-tab.active { background: var(--accent); color: white; box-shadow: var(--shadow-sm); }
        .nav-tab-icon { margin-right: 6px; }

        .page-shell { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .page-header {
          background: var(--panel); box-shadow: var(--shadow-sm);
          display: flex; align-items: center; gap: 12px;
          padding: 8px 20px; flex-shrink: 0; flex-wrap: wrap; z-index: 5;
        }

        .page-body { flex: 1; display: grid; grid-template-columns: 272px 1fr; overflow: hidden; }

        .sidebar { background: var(--panel); box-shadow: 2px 0 8px rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden; z-index: 4; }
        .sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); }
        .sidebar-tab {
          flex: 1; padding: 10px; text-align: center;
          font-family: 'Montserrat', sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; color: var(--muted); border: none; background: transparent;
          border-bottom: 2px solid transparent; transition: all 0.15s;
        }
        .sidebar-tab:hover { color: var(--accent); }
        .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 8px; background: var(--bg); }
        .sidebar-list::-webkit-scrollbar { width: 4px; }
        .sidebar-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .sidebar-footer { padding: 10px; border-top: 1px solid var(--border); background: var(--panel); }

        .song-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px;
          border: 1.5px solid transparent; transition: all 0.12s;
          background: var(--panel); box-shadow: var(--shadow-sm);
        }
        .song-row:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .song-row.active { border-color: var(--accent); background: var(--accent-light); box-shadow: var(--shadow-md); }
        .song-row.drag-over { border-color: var(--accent); background: var(--accent-light); }
        .drag-handle { color: var(--muted); font-size: 0.8rem; cursor: grab; opacity: 0; transition: opacity 0.15s; }
        .song-row:hover .drag-handle { opacity: 1; }
        .song-row-num { font-family: 'Courier Prime', monospace; font-size: 0.75rem; color: var(--muted); min-width: 18px; text-align: right; }
        .song-row-info { flex: 1; min-width: 0; }
        .song-row-title { font-size: 0.85rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
        .song-row-meta { font-size: 0.7rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-row-key { font-family: 'Courier Prime', monospace; font-size: 0.72rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1px solid rgba(232,98,26,0.2); padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
        .song-row-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
        .song-row:hover .song-row-actions { opacity: 1; }
        .row-btn { width: 24px; height: 24px; border-radius: 5px; border: none; background: transparent; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all 0.12s; }
        .row-btn:hover { background: var(--bg); color: var(--text); }
        .row-btn.danger:hover { background: #FEE2E2; color: var(--danger); }
        .row-btn.add:hover { background: #D1FAE5; color: var(--green); }
        .row-btn.remove:hover { background: #FEE2E2; color: var(--danger); }

        .main { overflow-y: auto; padding: 28px 36px; background: var(--bg); }
        .main::-webkit-scrollbar { width: 6px; }
        .main::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .btn-full { width: 100%; padding: 10px; background: var(--accent); color: white; border: none; border-radius: 9px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
        .btn-full:hover { background: var(--accent2); box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .btn-primary { padding: 8px 18px; background: var(--accent); color: white; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
        .btn-primary:hover { background: var(--accent2); box-shadow: var(--shadow-md); }
        .btn-ghost { padding: 8px 18px; background: white; color: var(--muted); border: 1.5px solid var(--border); border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

        .pill-btn { padding: 5px 12px; border-radius: 20px; border: 1.5px solid var(--border); background: white; color: var(--muted); font-family: 'Montserrat', sans-serif; font-size: 0.68rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; box-shadow: var(--shadow-sm); }
        .pill-btn:hover { border-color: var(--text); color: var(--text); }
        .pill-btn.accent { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .pill-btn.accent:hover { background: var(--accent); color: white; }
        .pill-btn.green { border-color: var(--green); color: var(--green); }
        .pill-btn.green:hover { background: var(--green); color: white; }
        .pill-badge { padding: 2px 8px; border-radius: 20px; background: #D1FAE5; color: var(--green); font-size: 0.68rem; font-weight: 700; }

        .toggle-group { display: flex; gap: 3px; padding: 3px; background: var(--bg); border-radius: 9px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); }
        .toggle-btn { padding: 4px 10px; border: none; border-radius: 7px; font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; background: transparent; color: var(--muted); text-transform: uppercase; transition: all 0.15s; }
        .toggle-btn:hover { color: var(--accent); }
        .toggle-btn.active { background: white; color: var(--accent); box-shadow: var(--shadow-sm); }

        .btn-icon { width: 30px; height: 30px; background: white; border: 1.5px solid var(--border); border-radius: 7px; color: var(--text); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; box-shadow: var(--shadow-sm); }
        .btn-icon:hover { border-color: var(--accent); color: var(--accent); box-shadow: var(--shadow-md); }
        .icon-btn { width: 26px; height: 26px; border-radius: 6px; border: 1.5px solid var(--border); background: white; color: var(--muted); cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all 0.12s; box-shadow: var(--shadow-sm); }
        .icon-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); background: #FEE2E2; }
        .icon-btn:disabled { opacity: 0.25; cursor: default; box-shadow: none; }

        .transpose-bar { display: flex; align-items: center; gap: 6px; }
        .transpose-label { font-family: 'Montserrat', sans-serif; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .semitone-display { font-family: 'Courier Prime', monospace; font-size: 0.95rem; color: var(--accent); font-weight: 700; min-width: 36px; text-align: center; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: var(--muted); gap: 10px; }
        .empty-icon { font-size: 3rem; opacity: 0.2; }
        .empty-text { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: var(--muted); }
        .empty-sub { font-size: 0.82rem; }
        .empty-sidebar { color: var(--muted); font-size: 0.78rem; text-align: center; padding: 20px 8px; }

        .song-display { max-width: 680px; }
        .song-display-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid var(--border); }
        .song-display-title { font-family: 'Montserrat', sans-serif; font-size: 1.7rem; font-weight: 900; line-height: 1.1; color: var(--text); }
        .song-display-artist { color: var(--muted); font-size: 0.88rem; margin-top: 4px; }
        .key-badge { font-family: 'Courier Prime', monospace; font-size: 0.95rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1.5px solid rgba(232,98,26,0.25); padding: 6px 14px; border-radius: 8px; min-width: 52px; text-align: center; box-shadow: var(--shadow-sm); }
        .song-content { font-family: 'Courier Prime', monospace; font-size: 0.9rem; line-height: 1.5; }
        .chord-line { color: var(--chord); font-weight: 700; white-space: pre; margin-bottom: 2px; }
        .lyric-line { color: var(--lyric); white-space: pre; margin-bottom: 10px; }

        .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
        .editor-card { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .editor-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 900; margin-bottom: 18px; color: var(--accent); }
        .editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .editor-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
        .editor-field-sm { max-width: 180px; }
        .editor-field label { font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .label-hint { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 0.62rem; }
        .editor-field input, .editor-field select, .editor-field textarea { background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
        .editor-field textarea { font-family: 'Courier Prime', monospace; resize: vertical; }
        .editor-field input:focus, .editor-field select:focus, .editor-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.1); }
        .editor-field select { cursor: pointer; }
        .editor-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }

        .program-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .program-body { flex: 1; display: grid; grid-template-columns: 300px 1fr; overflow: hidden; }

        .prog-details { background: var(--panel); box-shadow: 2px 0 8px rgba(0,0,0,0.06); padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 0; z-index: 3; }
        .prog-details::-webkit-scrollbar { width: 4px; }
        .prog-details::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .prog-section-title { font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
        .prog-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

        .prog-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .prog-field label { font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); }
        .prog-field input, .prog-field textarea, .prog-field select { background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.85rem; outline: none; transition: all 0.15s; }
        .prog-field input:focus, .prog-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.1); }
        .prog-field textarea { resize: vertical; font-size: 0.82rem; }
        .prog-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .prog-toolbar-left { display: flex; align-items: center; gap: 10px; flex: 1; }
        .prog-sync-info { font-size: 0.78rem; color: var(--muted); }

        .prog-order { overflow-y: auto; padding: 16px 20px; background: var(--bg); }
        .prog-order::-webkit-scrollbar { width: 5px; }
        .prog-order::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .prog-items-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }

        .prog-item {
          display: flex; align-items: flex-start; gap: 10px;
          background: white; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px;
          transition: all 0.15s; box-shadow: var(--shadow-sm);
        }
        .prog-item:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .prog-item.song { border-left: 4px solid var(--accent); }
        .prog-item.section { border-left: 4px solid var(--blue); }

        .prog-item-left { display: flex; align-items: center; gap: 6px; padding-top: 2px; }
        .prog-num { font-family: 'Courier Prime', monospace; font-size: 0.72rem; color: var(--muted); min-width: 18px; text-align: right; }
        .prog-type-badge { font-size: 1rem; }

        .prog-item-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .prog-item-actions { display: flex; gap: 4px; flex-shrink: 0; padding-top: 2px; }

        .prog-select { background: var(--bg); border: 1.5px solid var(--border); border-radius: 7px; padding: 7px 10px; color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.82rem; outline: none; cursor: pointer; width: 100%; transition: all 0.15s; }
        .prog-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.1); }

        .prog-input { background: var(--bg); border: 1.5px solid var(--border); border-radius: 7px; padding: 7px 10px; color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.82rem; outline: none; width: 100%; transition: all 0.15s; }
        .prog-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .prog-input-sm { font-size: 0.76rem; color: var(--muted); }

        .prog-song-info { display: flex; flex-direction: column; gap: 5px; }
        .prog-song-meta { font-size: 0.72rem; color: var(--muted); }
        .prog-section-info { display: flex; flex-direction: column; gap: 5px; }

        .setlist-summary { display: flex; flex-direction: column; gap: 4px; }
        .summary-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 7px; background: var(--bg); border: 1px solid var(--border); }
        .summary-num { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--muted); min-width: 18px; text-align: right; }
        .summary-title { flex: 1; font-size: 0.8rem; font-weight: 700; }
        .summary-key { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--accent); background: var(--accent-light); border: 1px solid rgba(232,98,26,0.2); padding: 1px 5px; border-radius: 4px; }

        .preview-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 24px; background: var(--panel); box-shadow: var(--shadow-sm); flex-shrink: 0; }
        .preview-doc { flex: 1; overflow-y: auto; padding: 40px; max-width: 720px; margin: 0 auto; }
        .preview-church { font-family: 'Montserrat', sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--muted); margin-bottom: 6px; }
        .preview-title { font-family: 'Montserrat', sans-serif; font-size: 1.8rem; font-weight: 900; color: var(--accent); margin-bottom: 4px; }
        .preview-date { font-size: 0.88rem; color: var(--muted); margin-bottom: 20px; }
        .preview-sermon { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
        .preview-sermon-title { font-family: 'Montserrat', sans-serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 4px; }
        .preview-speaker { font-size: 0.82rem; color: var(--muted); }
        .preview-scripture { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; font-style: italic; }
        .preview-scripture-label { font-style: normal; font-weight: 700; color: var(--text); }
        .preview-divider { border: none; border-top: 2px solid var(--border); margin: 20px 0; }
        .preview-items { display: flex; flex-direction: column; gap: 8px; }
        .preview-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 14px; border-radius: 9px; background: white; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .preview-item.song { border-left: 4px solid var(--accent); }
        .preview-item.section { border-left: 4px solid var(--blue); }
        .preview-item-num { font-family: 'Courier Prime', monospace; font-size: 0.72rem; color: var(--muted); min-width: 20px; padding-top: 2px; }
        .preview-item-song { font-weight: 700; font-size: 0.92rem; }
        .preview-item-meta { font-size: 0.78rem; color: var(--muted); }
        .preview-item-section { font-size: 0.88rem; font-weight: 700; color: var(--text); }
        .preview-item-note { font-size: 0.78rem; color: var(--muted); font-style: italic; }
        .preview-notes { font-size: 0.82rem; color: var(--muted); line-height: 1.6; }

        .desktop-only { display: grid !important; }
        .mobile-only { display: none !important; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .topbar { padding: 0 12px; height: 52px; }
          .topbar-logo-text { font-size: 0.9rem; }
          .topbar-logo-sub { display: none; }
          .page-header { padding: 6px 10px; gap: 6px; }
          .main { padding: 16px; }
          .song-display-title { font-size: 1.2rem; }
          .song-content { font-size: 0.8rem; }
          .editor-card { padding: 18px; border-radius: 12px; }
          .editor-row { grid-template-columns: 1fr; }
        }

        @media print {
          .topbar, .preview-toolbar { display: none !important; }
          body { background: white !important; color: black !important; }
          .preview-doc { padding: 20px; max-width: 100%; }
          .preview-title { color: #E8621A !important; }
          .preview-item { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div className="shell">
        <div className="topbar">
          <div className="topbar-logo">
            <CFCLogo size={28} />
            <div>
              <div className="topbar-logo-text"><span>CFC</span> Worship Pro</div>
              <div className="topbar-logo-sub">Christian Family Church</div>
            </div>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${page==="setlist"?"active":""}`} onClick={() => setPage("setlist")}>
              <span className="nav-tab-icon">🎸</span>Setlist
            </button>
            <button className={`nav-tab ${page==="program"?"active":""}`} onClick={() => setPage("program")}>
              <span className="nav-tab-icon">📋</span>Program
            </button>
          </div>
        </div>

        <div className="page-shell">
          {page === "setlist" ? (
            <SetlistPage songs={songs} setSongs={setSongs} setlist={setlist} setSetlist={setSetlist} />
          ) : (
            <ProgramPage songs={songs} program={program} setProgram={setProgram} setlist={setlist} setSetlist={setSetlist} />
          )}
        </div>
      </div>
    </>
  );
}
