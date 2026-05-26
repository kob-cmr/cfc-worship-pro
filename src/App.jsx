import { useState, useEffect } from "react";
import { SAMPLE_SONGS, INITIAL_PROGRAMS, SAMPLE_EVENTS } from "./shared.js";
import SetlistPage from "./SetlistPage.jsx";
import ProgramPage from "./ProgramPage.jsx";
import CalendarPage from "./CalendarPage.jsx";

// ── Logo SVG ──────────────────────────────────────────────────────────────────
const Logo = ({ size = 40, color = "#fff" }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 80 112" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="33" y="0" width="14" height="18" fill={color}/>
    <rect x="20" y="13" width="40" height="11" fill={color}/>
    <polygon points="40,28 70,52 70,108 10,108 10,52" fill="none" stroke={color} strokeWidth="9" strokeLinejoin="round"/>
    <rect x="29" y="68" width="22" height="40" fill={color}/>
  </svg>
);

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1800);
    const t2 = setTimeout(() => onDone(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`splash${fade ? " splash-fade" : ""}`}>
      <div className="splash-inner">
        <div className="splash-logo-wrap">
          <Logo size={52} color="#fff" />
        </div>
        <div className="splash-title">CenterStage</div>
        <div className="splash-sub">Plan. Coordinate. Serve.</div>
      </div>
      <div className="splash-footer">© 2025 CenterStage</div>
    </div>
  );
}

// ── Enter Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  return (
    <div className="auth-landing">
      <div className="auth-landing-top">
        <div className="auth-landing-logo"><Logo size={52} color="#fff" /></div>
        <div className="auth-landing-title">CenterStage</div>
        <div className="auth-landing-sub">Plan. Coordinate. Serve.</div>
      </div>
      <div className="auth-landing-bottom">
        <button className="auth-landing-btn primary" onClick={() => onLogin({})}>Enter</button>
        <div className="auth-landing-copy">© 2025 CenterStage</div>
      </div>
    </div>
  );
}


// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning!", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon!", emoji: "🌤" };
  return { text: "Good evening!", emoji: "🌙" };
}

// ── Burger Menu ───────────────────────────────────────────────────────────────
function BurgerMenu({ page, setPage, open, setOpen }) {
  if (!open) return null;
  const items = [
    { id:"home",     icon:"🏠", label:"Home" },
    { id:"program",  icon:"📋", label:"Program" },
    { id:"calendar", icon:"📅", label:"Calendar" },
    { id:"setlist",  icon:"🎸", label:"Setlist" },
  ];
  return (
    <>
      <div className="menu-backdrop" onClick={() => setOpen(false)} />
      <div className="menu-drawer">
        <div className="menu-header" style={{padding:"52px 22px 22px"}}>
          <div className="menu-avatar" style={{background:"rgba(255,255,255,0.25)",fontSize:"1.4rem"}}>🎵</div>
          <div>
            <div className="menu-user-name">CenterStage</div>
            <div className="menu-user-role">Worship Team App</div>
          </div>
        </div>
        <div className="menu-items">
          {items.map(item => (
            <button key={item.id} className={`menu-item ${page===item.id?"active":""}`}
              onClick={() => { setPage(item.id); setOpen(false); }}>
              <span className="menu-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {page===item.id && <span className="menu-active-dot" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ title, onBurger }) {
  return (
    <div className="topbar">
      <button className="burger-btn" onClick={onBurger}>
        <span /><span /><span />
      </button>
      <div className="topbar-title">{title}</div>
      <div style={{width:40}} />
    </div>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
function HomePage({ setPage, programs, events }) {
  const recentProgram = programs.length > 0 ? programs[programs.length - 1] : null;
  const today = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date + "T00:00:00") >= new Date(today.toDateString()))
    .sort((a,b) => new Date(a.date) - new Date(b.date));
  const greeting = getGreeting();

  const widgets = [
    { id:"program",  icon:"📋", label:"Program",  desc: recentProgram ? recentProgram.title : "No programs yet",  color:"#2563EB", bg:"#EFF6FF" },
    { id:"calendar", icon:"📅", label:"Calendar",  desc: upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming event${upcomingEvents.length>1?"s":""}` : "No upcoming events", color:"#7C3AED", bg:"#F5F3FF" },
    { id:"setlist",  icon:"🎸", label:"Setlist",   desc: recentProgram ? `${recentProgram.items.filter(i=>i.type==="song"&&i.songId).length} songs` : "No songs yet", color:"#0D9488", bg:"#F0FDFA" },
  ];

  return (
    <div className="home-wrap">
      {/* Greeting banner */}
      <div className="home-banner">
        <div className="home-banner-inner">
          <div className="home-greeting-name">{greeting.text} {greeting.emoji}</div>
          <div className="home-date">{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        </div>
      </div>

      <div className="home-content">
        {recentProgram && (
          <div className="home-recent" onClick={() => setPage("program")}>
            <div className="home-recent-left">
              <div className="home-recent-label">Current Service</div>
              <div className="home-recent-title">{recentProgram.title}</div>
              <div className="home-recent-meta">{recentProgram.date}{recentProgram.time ? ` · ${recentProgram.time}` : ""}</div>
            </div>
            <div className="home-recent-arrow">→</div>
          </div>
        )}

        <div className="home-section-label">Quick Access</div>
        <div className="home-widgets">
          {widgets.map(w => (
            <button key={w.id} className="widget-card" onClick={() => setPage(w.id)}
              style={{"--wcolor":w.color,"--wbg":w.bg}}>
              <div className="widget-icon-wrap" style={{background:w.bg}}>
                <span className="widget-icon">{w.icon}</span>
              </div>
              <div className="widget-label">{w.label}</div>
              <div className="widget-desc">{w.desc}</div>
              <div className="widget-arrow" style={{color:w.color}}>→</div>
            </button>
          ))}
        </div>

        {upcomingEvents.length > 0 && (
          <>
            <div className="home-section-label" style={{marginTop:20}}>Upcoming</div>
            {upcomingEvents.slice(0,3).map(ev=>(
              <div key={ev.id} className="home-event-row" onClick={()=>setPage("calendar")}>
                <div className="home-event-dot" style={{background:ev.color}}/>
                <div className="home-event-info">
                  <div className="home-event-title">{ev.title}</div>
                  <div className="home-event-meta">{new Date(ev.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}{ev.time?` · ${ev.time}`:""}{ev.location?` · ${ev.location}`:""}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [splash, setSplash] = useState(true);
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [songs, setSongs] = useState(SAMPLE_SONGS);
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [events, setEvents] = useState(SAMPLE_EVENTS);

  const recentProgram = programs.length > 0 ? programs[programs.length - 1] : null;
  const setlist = recentProgram
    ? recentProgram.items.filter(i => i.type==="song" && i.songId).map(i => i.songId)
    : [];

  const pageTitles = { home:"CenterStage", program:"Program", calendar:"Calendar", setlist:"Setlist" };

  if (splash) return (
    <>
      <GlobalStyles />
      <SplashScreen onDone={() => setSplash(false)} />
    </>
  );
  if (!entered) return (
    <>
      <GlobalStyles />
      <AuthScreen onLogin={() => setEntered(true)} />
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div className="app-shell">
        <TopBar title={pageTitles[page] || "CenterStage"} onBurger={() => setMenuOpen(true)} />
        <BurgerMenu page={page} setPage={setPage} open={menuOpen} setOpen={setMenuOpen} />
        <div className="page-content">
          {page==="home"     && <HomePage setPage={setPage} programs={programs} events={events} />}
          {page==="program"  && <ProgramPage songs={songs} setSongs={setSongs} programs={programs} setPrograms={setPrograms} />}
          {page==="setlist"  && <SetlistPage songs={songs} setSongs={setSongs} setlist={setlist} setSetlist={()=>{}} />}
          {page==="calendar" && <CalendarPage events={events} setEvents={setEvents} />}
        </div>
      </div>
    </>
  );
}

// ── Global Styles ─────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Courier+Prime:wght@400;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #F8FAFC;
        --panel: #FFFFFF;
        --border: #E2E8F0;
        --accent: #2563EB;
        --accent2: #3B82F6;
        --accent-light: #EFF6FF;
        --accent-dark: #1D4ED8;
        --text: #0F172A;
        --text2: #334155;
        --muted: #94A3B8;
        --chord: #2563EB;
        --lyric: #334155;
        --danger: #EF4444;
        --green: #10B981;
        --purple: #7C3AED;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
        --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
        --shadow-lg: 0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
        --radius: 14px;
        --radius-sm: 10px;
        --radius-pill: 100px;
      }
      html, body, #root { height: 100%; }
      body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
      button { cursor: pointer; font-family: inherit; }
      input, select, textarea { font-family: inherit; }
      input, select { -webkit-appearance: none; }

      /* ── Splash ── */
      .splash {
        position: fixed; inset: 0; z-index: 999;
        background: linear-gradient(160deg, #1D4ED8 0%, #2563EB 40%, #3B82F6 70%, #93C5FD 100%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        transition: opacity .7s ease;
      }
      .splash-fade { opacity: 0; pointer-events: none; }
      .splash-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; flex: 1; justify-content: center; }
      .splash-logo-wrap { background: rgba(255,255,255,0.15); border-radius: 24px; padding: 18px; backdrop-filter: blur(8px); animation: popIn .5s ease forwards; }
      @keyframes popIn { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
      .splash-title { font-size: 2.4rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
      .splash-sub { font-size: 0.9rem; color: rgba(255,255,255,0.75); letter-spacing: 0.04em; }
      .splash-footer { font-size: 0.72rem; color: rgba(255,255,255,0.45); padding-bottom: 24px; }

      /* ── Auth Landing ── */
      .auth-landing {
        min-height: 100vh; display: flex; flex-direction: column;
        background: linear-gradient(160deg, #1D4ED8 0%, #2563EB 40%, #3B82F6 70%, #93C5FD 100%);
      }
      .auth-landing-top { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px 32px; gap: 14px; }
      .auth-landing-logo { background: rgba(255,255,255,0.15); border-radius: 22px; padding: 16px; backdrop-filter: blur(8px); }
      .auth-landing-title { font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
      .auth-landing-sub { font-size: 0.85rem; color: rgba(255,255,255,0.75); letter-spacing: 0.04em; }
      .auth-landing-bottom { padding: 24px 28px 40px; display: flex; flex-direction: column; gap: 12px; max-width: 420px; margin: 0 auto; width: 100%; }
      .auth-landing-btn { width: 100%; padding: 16px; border-radius: var(--radius-pill); font-size: 1rem; font-weight: 700; border: none; transition: all .15s; letter-spacing: 0.01em; }
      .auth-landing-btn.primary { background: #fff; color: var(--accent); }
      .auth-landing-btn.primary:hover { background: #EFF6FF; }
      .auth-landing-btn.outline { background: rgba(255,255,255,0.15); color: #fff; border: 1.5px solid rgba(255,255,255,0.5); backdrop-filter: blur(8px); }
      .auth-landing-btn.outline:hover { background: rgba(255,255,255,0.25); }
      .auth-landing-copy { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-top: 4px; }

      /* ── Auth Page (Login / Signup) ── */
      .auth-page { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; }
      .auth-page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--panel); border-bottom: 1px solid var(--border); }
      .auth-back-btn { width: 36px; height: 36px; border: none; background: var(--bg); border-radius: 50%; font-size: 1rem; color: var(--text); display: flex; align-items: center; justify-content: center; transition: background .15s; }
      .auth-back-btn:hover { background: var(--border); }
      .auth-page-logo { display: flex; align-items: center; }
      .auth-page-title-sm { font-size: 0.95rem; font-weight: 700; color: var(--text); }
      .auth-page-body { flex: 1; padding: 28px 24px; max-width: 420px; margin: 0 auto; width: 100%; }
      .auth-page-title { font-size: 1.8rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; margin-bottom: 4px; }
      .auth-page-sub { font-size: 0.85rem; color: var(--muted); margin-bottom: 24px; }
      .auth-error { background: #FEF2F2; color: var(--danger); border: 1px solid #FECACA; border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }
      .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
      .auth-field label { font-size: 0.78rem; font-weight: 600; color: var(--text2); }
      .auth-field input {
        background: var(--panel); border: 1.5px solid var(--border);
        border-radius: var(--radius-sm); padding: 13px 16px;
        font-size: 0.95rem; color: var(--text); outline: none;
        transition: border-color .15s, box-shadow .15s; width: 100%;
      }
      .auth-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      .auth-pw-wrap { position: relative; }
      .auth-pw-wrap input { width: 100%; padding-right: 44px; }
      .auth-pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1rem; color: var(--muted); padding: 4px; }
      .auth-submit-btn {
        width: 100%; padding: 15px; background: var(--accent); color: white;
        border: none; border-radius: var(--radius-pill); font-size: 1rem; font-weight: 700;
        transition: all .15s; box-shadow: 0 4px 16px rgba(37,99,235,0.3); margin-bottom: 16px; margin-top: 4px;
      }
      .auth-submit-btn:hover { background: var(--accent-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
      .auth-switch { text-align: center; font-size: 0.85rem; color: var(--muted); }
      .auth-link { background: none; border: none; color: var(--accent); font-weight: 700; font-size: 0.85rem; }

      /* ── App Shell ── */
      .app-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
      .page-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

      /* ── Top Bar ── */
      .topbar {
        background: var(--panel); border-bottom: 1px solid var(--border);
        display: flex; align-items: center; justify-content: space-between;
        height: 56px; padding: 0 16px; flex-shrink: 0;
        box-shadow: var(--shadow-sm); z-index: 10;
      }
      .burger-btn { width: 40px; height: 40px; border: none; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border-radius: var(--radius-sm); transition: background .15s; }
      .burger-btn:hover { background: var(--bg); }
      .burger-btn span { display: block; width: 20px; height: 2px; background: var(--text); border-radius: 2px; }
      .topbar-title { font-size: 1rem; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
      .topbar-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--accent); color: white; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }

      /* ── Burger Drawer ── */
      .menu-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 90; backdrop-filter: blur(3px); }
      .menu-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 290px; background: var(--panel); z-index: 91; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; animation: slideIn .22s ease; }
      @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
      .menu-header { padding: 52px 22px 22px; background: linear-gradient(135deg, #1D4ED8, #3B82F6); display: flex; align-items: center; gap: 14px; }
      .menu-avatar { width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.25); color: white; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.4); }
      .menu-user-name { font-size: 0.95rem; font-weight: 700; color: white; }
      .menu-user-role { font-size: 0.72rem; color: rgba(255,255,255,0.75); margin: 2px 0; }
      .menu-user-email { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
      .menu-items { flex: 1; padding: 10px 10px; display: flex; flex-direction: column; gap: 2px; }
      .menu-item { display: flex; align-items: center; gap: 14px; padding: 13px 14px; border: none; background: transparent; border-radius: var(--radius-sm); font-size: 0.92rem; font-weight: 500; color: var(--text2); transition: all .15s; position: relative; }
      .menu-item:hover { background: var(--accent-light); color: var(--accent); }
      .menu-item.active { background: var(--accent-light); color: var(--accent); font-weight: 700; }
      .menu-item-icon { font-size: 1.2rem; width: 26px; text-align: center; }
      .menu-active-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); margin-left: auto; }
      .menu-footer { padding: 14px; border-top: 1px solid var(--border); }
      .menu-logout { width: 100%; padding: 12px; border: 1.5px solid var(--border); background: transparent; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; color: var(--muted); transition: all .15s; }
      .menu-logout:hover { border-color: var(--danger); color: var(--danger); background: #FEF2F2; }

      /* ── Home ── */
      .home-wrap { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
      .home-wrap::-webkit-scrollbar { width: 5px; }
      .home-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      .home-banner { background: linear-gradient(135deg, #1D4ED8, #3B82F6); padding: 28px 22px 32px; }
      .home-banner-inner { max-width: 600px; margin: 0 auto; }
      .home-greeting-sub { font-size: 0.85rem; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
      .home-greeting-name { font-size: 1.6rem; font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 4px; }
      .home-date { font-size: 0.78rem; color: rgba(255,255,255,0.65); }
      .home-content { flex: 1; padding: 20px 18px 32px; max-width: 600px; margin: 0 auto; width: 100%; }
      .home-recent { background: var(--panel); border-radius: var(--radius); padding: 16px 18px; margin-bottom: 22px; box-shadow: var(--shadow-md); cursor: pointer; display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--border); transition: all .15s; margin-top: -20px; }
      .home-recent:hover { box-shadow: var(--shadow-lg); border-color: var(--accent); }
      .home-recent-left { flex: 1; min-width: 0; }
      .home-recent-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 3px; }
      .home-recent-title { font-size: 0.95rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .home-recent-meta { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
      .home-recent-arrow { font-size: 1.1rem; color: var(--accent); }
      .home-section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
      .home-widgets { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
      .widget-card { background: var(--panel); border-radius: var(--radius); padding: 18px 16px; border: none; text-align: left; box-shadow: var(--shadow-sm); transition: all .18s; display: flex; flex-direction: column; gap: 6px; border: 1.5px solid var(--border); min-height: 130px; cursor: pointer; }
      .widget-card:hover { box-shadow: var(--shadow-md); border-color: var(--wcolor,var(--accent)); transform: translateY(-2px); }
      .widget-icon-wrap { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; background: var(--wbg,var(--accent-light)); }
      .widget-icon { font-size: 1.4rem; }
      .widget-label { font-size: 0.9rem; font-weight: 700; color: var(--text); }
      .widget-desc { font-size: 0.7rem; color: var(--muted); flex: 1; line-height: 1.4; }
      .widget-arrow { font-size: 1rem; font-weight: 700; align-self: flex-end; }
      .home-event-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--panel); border-radius: var(--radius-sm); margin-bottom: 6px; box-shadow: var(--shadow-sm); cursor: pointer; border: 1px solid var(--border); transition: all .12s; }
      .home-event-row:hover { border-color: var(--accent); }
      .home-event-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .home-event-info { flex: 1; min-width: 0; }
      .home-event-title { font-size: 0.85rem; font-weight: 600; color: var(--text); }
      .home-event-meta { font-size: 0.7rem; color: var(--muted); margin-top: 1px; }

      /* ── Shared buttons ── */
      .btn-primary { padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: var(--radius-pill); font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
      .btn-primary:hover { background: var(--accent-dark); box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
      .btn-ghost { padding: 10px 18px; background: white; color: var(--text2); border: 1.5px solid var(--border); border-radius: var(--radius-pill); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s; }
      .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
      .btn-full { width: 100%; padding: 13px; background: var(--accent); color: white; border: none; border-radius: var(--radius-pill); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: 0 2px 8px rgba(37,99,235,0.2); }
      .btn-full:hover { background: var(--accent-dark); }
      .pill-btn { padding: 8px 16px; border-radius: var(--radius-pill); border: 1.5px solid var(--border); background: white; color: var(--text2); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; box-shadow: var(--shadow-sm); }
      .pill-btn:hover { border-color: var(--accent); color: var(--accent); }
      .pill-btn.accent { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
      .pill-btn.accent:hover { background: var(--accent); color: white; }
      .pill-btn.green { border-color: var(--green); color: var(--green); }
      .pill-btn.green:hover { background: var(--green); color: white; }
      .pill-badge { padding: 3px 9px; border-radius: var(--radius-pill); background: #D1FAE5; color: #065F46; font-size: 0.68rem; font-weight: 700; }

      .toggle-group { display: flex; gap: 2px; padding: 3px; background: var(--bg); border-radius: var(--radius-sm); border: 1px solid var(--border); }
      .toggle-btn { padding: 7px 12px; border: none; border-radius: 8px; font-size: 0.72rem; font-weight: 600; cursor: pointer; background: transparent; color: var(--muted); transition: all .15s; min-height: 36px; white-space: nowrap; }
      .toggle-btn:hover { color: var(--accent); }
      .toggle-btn.active { background: var(--accent); color: white; box-shadow: var(--shadow-sm); }

      .btn-icon { width: 36px; height: 36px; background: white; border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; box-shadow: var(--shadow-sm); flex-shrink: 0; }
      .btn-icon:hover { border-color: var(--accent); color: var(--accent); }
      .icon-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: white; color: var(--muted); cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; transition: all .12s; box-shadow: var(--shadow-sm); flex-shrink: 0; }
      .icon-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      .icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); background: #FEF2F2; }
      .icon-btn:disabled { opacity: .25; cursor: default; box-shadow: none; }

      .transpose-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap; }
      .semitone-display { font-family: 'Courier Prime', monospace; font-size: 1rem; color: var(--accent); font-weight: 700; min-width: 34px; text-align: center; }

      /* ── Sidebar / List ── */
      .sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--panel); flex-shrink: 0; }
      .sidebar-tab { flex: 1; padding: 14px 8px; text-align: center; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; color: var(--muted); border: none; background: transparent; border-bottom: 2px solid transparent; transition: all .15s; min-height: 50px; }
      .sidebar-tab:hover { color: var(--accent); }
      .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
      .sidebar-list { flex: 1; overflow-y: auto; padding: 10px; background: var(--bg); }
      .sidebar-list::-webkit-scrollbar { width: 4px; }
      .sidebar-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .sidebar-footer { padding: 12px; border-top: 1px solid var(--border); background: var(--panel); }

      .song-row { display: flex; align-items: center; gap: 8px; padding: 12px 12px; border-radius: var(--radius-sm); cursor: pointer; margin-bottom: 6px; border: 1.5px solid var(--border); transition: all .12s; background: var(--panel); box-shadow: var(--shadow-sm); min-height: 58px; }
      .song-row:hover { border-color: var(--accent); box-shadow: var(--shadow-md); }
      .song-row.active { border-color: var(--accent); background: var(--accent-light); }
      .song-row.drag-over { border-color: var(--accent); background: var(--accent-light); }
      .drag-handle { color: var(--muted); cursor: grab; opacity: 0; transition: opacity .15s; font-size: 0.9rem; }
      .song-row:hover .drag-handle { opacity: 1; }
      .song-row-num { font-family: 'Courier Prime', monospace; font-size: 0.72rem; color: var(--muted); min-width: 18px; text-align: right; }
      .song-row-info { flex: 1; min-width: 0; }
      .song-row-title { font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
      .song-row-meta { font-size: 0.7rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .song-row-key { font-family: 'Courier Prime', monospace; font-size: 0.72rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1px solid #BFDBFE; padding: 3px 8px; border-radius: var(--radius-pill); flex-shrink: 0; }
      .song-row-actions { display: flex; gap: 3px; }
      .row-btn { width: 34px; height: 34px; border-radius: var(--radius-sm); border: none; background: transparent; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all .12s; }
      .row-btn:hover { background: var(--bg); color: var(--text); }
      .row-btn.danger:hover { background: #FEF2F2; color: var(--danger); }
      .row-btn.add:hover { background: #D1FAE5; color: var(--green); }
      .row-btn.remove:hover { background: #FEF2F2; color: var(--danger); }

      .main { overflow-y: auto; padding: 22px 20px; background: var(--bg); }
      .main::-webkit-scrollbar { width: 5px; }
      .main::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

      .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--muted); gap: 8px; }
      .empty-icon { font-size: 2.5rem; opacity: 0.2; }
      .empty-text { font-size: 0.95rem; font-weight: 700; }
      .empty-sub { font-size: 0.82rem; }
      .empty-sidebar { color: var(--muted); font-size: 0.78rem; text-align: center; padding: 20px 8px; }

      /* ── Song display ── */
      .song-display { max-width: 680px; }
      .song-display-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid var(--border); }
      .song-display-title { font-size: 1.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
      .song-display-artist { color: var(--muted); font-size: 0.85rem; margin-top: 3px; }
      .key-badge { font-family: 'Courier Prime', monospace; font-size: 0.88rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1.5px solid #BFDBFE; padding: 6px 14px; border-radius: var(--radius-pill); min-width: 52px; text-align: center; box-shadow: var(--shadow-sm); }
      .song-content { font-family: 'Courier Prime', monospace; font-size: 0.9rem; line-height: 1.6; }
      .chord-line { color: var(--chord); font-weight: 700; white-space: pre; margin-bottom: 2px; }
      .lyric-line { color: var(--lyric); white-space: pre; margin-bottom: 10px; }

      /* ── Editor ── */
      .editor-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; backdrop-filter: blur(6px); }
      .editor-card { background: white; border-radius: 20px; padding: 24px; width: 100%; max-width: 600px; max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
      .editor-title { font-size: 1.15rem; font-weight: 800; margin-bottom: 18px; color: var(--accent); letter-spacing: -0.01em; }
      .editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .editor-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
      .editor-field label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
      .label-hint { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 0.62rem; }
      .editor-field input, .editor-field select, .editor-field textarea { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 10px 13px; color: var(--text); font-size: 0.88rem; outline: none; transition: border-color .15s; width: 100%; }
      .editor-field textarea { font-family: 'Courier Prime', monospace; resize: vertical; }
      .editor-field input:focus, .editor-field select:focus, .editor-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      .editor-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

      /* ── Program page ── */
      .program-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      .program-body { flex: 1; overflow: hidden; display: grid; grid-template-columns: 280px 1fr; }
      .prog-details { background: var(--panel); border-right: 1px solid var(--border); padding: 16px; overflow-y: auto; }
      .prog-details::-webkit-scrollbar { width: 4px; }
      .prog-details::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .prog-section-title { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
      .prog-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .prog-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
      .prog-field label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
      .prog-field input, .prog-field textarea, .prog-field select { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 9px 11px; color: var(--text); font-size: 0.85rem; outline: none; transition: all .15s; width: 100%; }
      .prog-field input:focus, .prog-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      .prog-field textarea { resize: vertical; }
      .prog-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .prog-toolbar-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; flex-wrap: wrap; }
      .prog-sync-info { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
      .prog-order { overflow-y: auto; padding: 16px 18px; background: var(--bg); }
      .prog-order::-webkit-scrollbar { width: 4px; }
      .prog-order::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .prog-items-list { display: flex; flex-direction: column; gap: 7px; margin-top: 4px; }
      .prog-item { display: flex; align-items: flex-start; gap: 8px; background: white; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px; transition: all .15s; box-shadow: var(--shadow-sm); }
      .prog-item:hover { box-shadow: var(--shadow-md); }
      .prog-item.song { border-left: 4px solid var(--accent); }
      .prog-item.section { border-left: 4px solid var(--purple); }
      .prog-item-left { display: flex; align-items: center; gap: 5px; padding-top: 2px; }
      .prog-num { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--muted); min-width: 16px; text-align: right; }
      .prog-type-badge { font-size: 0.95rem; }
      .prog-item-body { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
      .prog-item-actions { display: flex; gap: 3px; flex-shrink: 0; }
      .prog-select { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; color: var(--text); font-size: 0.82rem; outline: none; cursor: pointer; width: 100%; transition: all .15s; }
      .prog-select:focus { border-color: var(--accent); }
      .prog-input { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; color: var(--text); font-size: 0.82rem; outline: none; width: 100%; transition: all .15s; }
      .prog-input:focus { border-color: var(--purple); }
      .prog-input-sm { font-size: 0.75rem; color: var(--muted); }
      .prog-song-info { display: flex; flex-direction: column; gap: 4px; }
      .prog-song-meta { font-size: 0.7rem; color: var(--muted); }
      .prog-section-info { display: flex; flex-direction: column; gap: 4px; }
      .setlist-summary { display: flex; flex-direction: column; gap: 3px; }
      .summary-row { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); min-height: 36px; }
      .summary-num { font-family: 'Courier Prime', monospace; font-size: 0.68rem; color: var(--muted); min-width: 16px; text-align: right; }
      .summary-title { flex: 1; font-size: 0.78rem; font-weight: 600; }
      .summary-key { font-family: 'Courier Prime', monospace; font-size: 0.68rem; color: var(--accent); background: var(--accent-light); border: 1px solid #BFDBFE; padding: 1px 6px; border-radius: var(--radius-pill); }

      /* ── Preview ── */
      .preview-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      .preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px; background: var(--panel); box-shadow: var(--shadow-sm); flex-shrink: 0; gap: 8px; flex-wrap: wrap; }
      .preview-doc { flex: 1; overflow-y: auto; padding: 32px 24px; max-width: 680px; margin: 0 auto; width: 100%; }
      .preview-church { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--muted); margin-bottom: 6px; }
      .preview-title { font-size: 1.6rem; font-weight: 800; color: var(--accent); margin-bottom: 3px; letter-spacing: -0.02em; }
      .preview-date { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }
      .preview-sermon { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 14px; box-shadow: var(--shadow-sm); }
      .preview-sermon-title { font-size: 1rem; font-weight: 700; margin-bottom: 3px; }
      .preview-speaker { font-size: 0.8rem; color: var(--muted); }
      .preview-scripture { font-size: 0.82rem; color: var(--muted); margin-bottom: 14px; font-style: italic; }
      .preview-scripture-label { font-style: normal; font-weight: 700; color: var(--text); }
      .preview-divider { border: none; border-top: 2px solid var(--border); margin: 16px 0; }
      .preview-items { display: flex; flex-direction: column; gap: 6px; }
      .preview-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); background: white; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
      .preview-item.song { border-left: 4px solid var(--accent); }
      .preview-item.section { border-left: 4px solid var(--purple); }
      .preview-item-num { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--muted); min-width: 18px; padding-top: 2px; }
      .preview-item-song { font-weight: 700; font-size: 0.9rem; }
      .preview-item-meta { font-size: 0.75rem; color: var(--muted); }
      .preview-item-section { font-size: 0.85rem; font-weight: 700; }
      .preview-item-note { font-size: 0.75rem; color: var(--muted); font-style: italic; }
      .preview-notes { font-size: 0.8rem; color: var(--muted); line-height: 1.6; }

      /* ── Setlist controls ── */
      .sl-controls { background: var(--panel); box-shadow: var(--shadow-sm); flex-shrink: 0; z-index: 5; border-bottom: 1px solid var(--border); }
      .sl-ctrl-row { display: flex; align-items: center; gap: 8px; padding: 8px 14px; flex-wrap: wrap; border-bottom: 1px solid var(--border); }
      .sl-ctrl-row:last-child { border-bottom: none; }
      .ctrl-song-name { flex: 1; font-size: 0.75rem; font-weight: 600; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

      /* ── Mobile song nav ── */
      .mobile-song-back { padding: 10px 14px; background: var(--panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-sm); flex-shrink: 0; }
      .mobile-song-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: stretch; background: white; border-top: 2px solid var(--border); box-shadow: 0 -4px 20px rgba(0,0,0,0.08); min-height: 70px; z-index: 50; }
      .msn-btn { flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: none; background: transparent; color: var(--text); cursor: pointer; transition: background .15s; }
      .msn-btn:disabled { opacity: .25; cursor: default; }
      .msn-btn:not(:disabled):hover { background: var(--accent-light); }
      .msn-right { justify-content: flex-end; border-left: 1px solid var(--border); }
      .msn-arrow { font-size: 2.2rem; color: var(--accent); font-weight: 300; line-height: 1; flex-shrink: 0; }
      .msn-label { font-size: 0.72rem; font-weight: 600; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
      .msn-counter { font-family: 'Courier Prime', monospace; font-size: 0.75rem; color: var(--muted); padding: 0 10px; display: flex; align-items: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); white-space: nowrap; }

      .desktop-song-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding-top: 18px; border-top: 2px solid var(--border); gap: 12px; }
      .dsn-btn { flex: 1; padding: 12px 16px; background: white; border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .dsn-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
      .dsn-btn:disabled { opacity: .3; cursor: default; }

      .btn-perform { padding: 9px 16px; background: var(--accent); color: white; border: none; border-radius: var(--radius-pill); font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all .15s; box-shadow: 0 2px 8px rgba(37,99,235,0.3); flex-shrink: 0; }
      .btn-perform:hover { background: var(--accent-dark); }

      /* ── Calendar ── */
      .cal-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      .cal-header { background: var(--panel); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); box-shadow: var(--shadow-sm); flex-shrink: 0; gap: 10px; }
      .cal-month-nav { display: flex; align-items: center; gap: 10px; }
      .cal-month-label { font-size: 1rem; font-weight: 800; color: var(--text); min-width: 160px; text-align: center; letter-spacing: -0.01em; }
      .cal-grid-wrap { flex: 1; overflow-y: auto; padding: 14px 14px; }
      .cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
      .cal-day-label { text-align: center; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 4px 0; }
      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
      .cal-cell { min-height: 70px; background: var(--panel); border-radius: var(--radius-sm); padding: 6px; border: 1.5px solid var(--border); cursor: pointer; transition: all .12s; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
      .cal-cell:hover { border-color: var(--accent); box-shadow: var(--shadow-md); }
      .cal-cell.other-month { background: transparent; border-color: transparent; box-shadow: none; opacity: .4; }
      .cal-cell.today { border-color: var(--accent); background: var(--accent-light); }
      .cal-cell.today .cal-cell-num { color: var(--accent); font-weight: 900; }
      .cal-cell-num { font-family: 'Courier Prime', monospace; font-size: 0.82rem; color: var(--text); margin-bottom: 3px; }
      .cal-event-dot { font-size: 0.6rem; color: white; border-radius: 4px; padding: 1px 5px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
      .cal-add-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; background: var(--accent); color: white; border: none; border-radius: 50%; font-size: 1.6rem; box-shadow: 0 4px 20px rgba(37,99,235,0.4); z-index: 30; transition: all .15s; }
      .cal-add-fab:hover { background: var(--accent-dark); transform: scale(1.08); }
      .cal-events-list { margin-top: 16px; }
      .cal-event-card { background: var(--panel); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px; box-shadow: var(--shadow-sm); border-left: 4px solid; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; border: 1px solid var(--border); border-left-width: 4px; transition: all .12s; }
      .cal-event-card:hover { box-shadow: var(--shadow-md); }
      .cal-event-info { flex: 1; min-width: 0; }
      .cal-event-title { font-weight: 700; font-size: 0.88rem; }
      .cal-event-meta { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

      /* ── Page header ── */
      .page-header { background: var(--panel); box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 10px; padding: 8px 14px; flex-shrink: 0; flex-wrap: wrap; z-index: 5; border-bottom: 1px solid var(--border); }

      /* ── Responsive desktop layout ── */
      .page-body { flex: 1; display: none; }
      @media (min-width: 768px) {
        .page-body { display: grid; grid-template-columns: 260px 1fr; overflow: hidden; }
        .program-body { grid-template-columns: 260px 1fr; }
      }

      /* ── Fullscreen performance ── */
      .fs-overlay { position: fixed; inset: 0; z-index: 200; background: #0F172A; display: flex; flex-direction: column; touch-action: none; }
      .fs-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #1E293B; border-bottom: 1px solid #334155; flex-shrink: 0; flex-wrap: wrap; }
      .fs-close-btn { padding: 10px 16px; background: #334155; border: none; border-radius: var(--radius-pill); color: #F1F5F9; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; min-height: 44px; transition: background .15s; }
      .fs-close-btn:hover { background: var(--accent); }
      .fs-song-info { flex: 1; min-width: 0; }
      .fs-title { display: block; font-size: 0.95rem; font-weight: 800; color: #F1F5F9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .fs-artist { font-size: 0.7rem; color: #64748B; }
      .fs-key-badge { font-family: 'Courier Prime', monospace; font-size: 0.88rem; font-weight: 700; color: #60A5FA; background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.3); padding: 6px 12px; border-radius: var(--radius-pill); white-space: nowrap; }
      .fs-counter { font-family: 'Courier Prime', monospace; font-size: 0.78rem; color: #64748B; white-space: nowrap; }
      .fs-zoom-bar { display: flex; align-items: center; gap: 6px; padding: 6px 16px; background: #1E293B; border-bottom: 1px solid #334155; flex-shrink: 0; }
      .fs-zoom-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; }
      .fs-zoom-val { font-family: 'Courier Prime', monospace; font-size: 0.8rem; color: #60A5FA; min-width: 40px; text-align: center; }
      .fs-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px; }
      .fs-content::-webkit-scrollbar { width: 5px; }
      .fs-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      .fs-lines { max-width: 100%; }
      .fs-chord-line { font-family: 'Courier Prime', monospace; color: #60A5FA; font-weight: 700; white-space: pre-wrap; word-break: break-word; margin-bottom: 2px; line-height: 1.5; }
      .fs-lyric-line { font-family: 'Courier Prime', monospace; color: #CBD5E1; white-space: pre-wrap; word-break: break-word; margin-bottom: 10px; line-height: 1.6; }
      .fs-drum-line { font-family: 'Courier Prime', monospace; color: #A78BFA; white-space: pre-wrap; word-break: break-word; margin-bottom: 8px; line-height: 1.6; }
      .fs-nav { display: flex; align-items: stretch; background: #1E293B; border-top: 1px solid #334155; flex-shrink: 0; min-height: 80px; }
      .fs-nav-btn { flex: 1; display: flex; align-items: center; gap: 10px; padding: 14px 18px; border: none; background: transparent; color: #F1F5F9; cursor: pointer; transition: background .15s; min-height: 80px; }
      .fs-nav-btn:disabled { opacity: .25; cursor: default; }
      .fs-nav-btn:not(:disabled):hover { background: rgba(96,165,250,0.1); }
      .fs-prev { justify-content: flex-start; border-right: 1px solid #334155; }
      .fs-next { justify-content: flex-end; }
      .fs-nav-arrow { font-size: 3rem; font-weight: 300; line-height: 1; color: #60A5FA; flex-shrink: 0; }
      .fs-nav-label { font-size: 0.78rem; font-weight: 600; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
      .fs-dots { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; flex-shrink: 0; flex-wrap: wrap; max-width: 160px; }
      .fs-dot { width: 9px; height: 9px; border-radius: 50%; border: none; background: #334155; cursor: pointer; transition: all .15s; padding: 0; }
      .fs-dot.active { background: #3B82F6; transform: scale(1.3); }

      /* ── Tablet / Mobile ── */
      @media (max-width: 900px) {
        .toggle-btn { padding: 9px 12px !important; font-size: 0.72rem !important; min-height: 40px !important; }
        .btn-icon { width: 40px !important; height: 40px !important; }
        .semitone-display { font-size: 1rem !important; }
        .sl-ctrl-row { padding: 10px 12px !important; gap: 8px !important; }
        .song-row { min-height: 58px !important; padding: 12px 10px !important; }
        .row-btn { width: 36px !important; height: 36px !important; }
        .btn-full { padding: 14px !important; }
        .sidebar-tab { padding: 14px 8px !important; min-height: 52px !important; }
        .icon-btn { width: 40px !important; height: 40px !important; }
        .prog-select, .prog-input { padding: 10px 12px !important; }
        .pitem { padding: 14px !important; }
        .pill-btn { padding: 9px 14px !important; }
      }

      @media print {
        .topbar, .preview-toolbar { display: none !important; }
        body { background: white !important; }
        .preview-doc { padding: 20px; max-width: 100%; }
        .preview-title { color: var(--accent) !important; }
        .preview-item { box-shadow: none !important; }
      }
    `}</style>
  );
}
