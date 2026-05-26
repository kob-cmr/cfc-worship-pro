import { useState, useEffect } from "react";
import { TEAM_MEMBERS, SAMPLE_SONGS, INITIAL_PROGRAMS, SAMPLE_EVENTS } from "./shared.js";
import SetlistPage from "./SetlistPage.jsx";
import ProgramPage from "./ProgramPage.jsx";
import CalendarPage from "./CalendarPage.jsx";

// ── CFC Logo SVG ─────────────────────────────────────────────────────────────
const Logo = ({ size = 40, color = "#E8621A" }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 80 112" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="33" y="0" width="14" height="18" fill={color}/>
    <rect x="20" y="13" width="40" height="11" fill={color}/>
    <polygon points="40,28 70,52 70,108 10,108 10,52" fill="none" stroke={color} strokeWidth="9" strokeLinejoin="round"/>
    <rect x="29" y="68" width="22" height="40" fill={color}/>
  </svg>
);

// ── Splash Screen ─────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [fade, setFade] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1800);
    const t2 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`splash${fade ? " splash-fade" : ""}`}>
      <div className="splash-inner">
        <div className="splash-logo"><Logo size={56} color="#E8621A" /></div>
        <div className="splash-title">CenterStage</div>
        <div className="splash-sub">Plan. Coordinate. Serve.</div>
      </div>
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState(TEAM_MEMBERS);

  const handleLogin = () => {
    setError("");
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) { setError("Incorrect email or password."); return; }
    onLogin(user);
  };

  const handleSignup = () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { setError("An account with this email already exists."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    const newUser = { id: Date.now(), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role: "viewer" };
    setUsers(u => [...u, newUser]);
    onLogin(newUser);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><Logo size={36} color="#E8621A" /></div>
        <div className="auth-title">CenterStage</div>
        <div className="auth-sub">Plan. Coordinate. Serve.</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); }}>Log In</button>
          <button className={`auth-tab ${mode==="signup"?"active":""}`} onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button>
        </div>

        {mode === "signup" && (
          <div className="auth-row">
            <div className="auth-field">
              <label>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="auth-field">
              <label>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>
        )}
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key==="Enter" && (mode==="login"?handleLogin():handleSignup())} />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" onKeyDown={e => e.key==="Enter" && (mode==="login"?handleLogin():handleSignup())} />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-btn" onClick={mode==="login"?handleLogin:handleSignup}>
          {mode==="login" ? "Log In" : "Create Account"}
        </button>
        {mode==="login" && <div className="auth-hint">New to CenterStage? <button className="auth-link" onClick={() => { setMode("signup"); setError(""); }}>Sign up</button></div>}
      </div>
    </div>
  );
}

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting(name) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}! ☀️`;
  if (h < 17) return `Good afternoon, ${name}! 🌤`;
  return `Good evening, ${name}! 🌙`;
}

// ── Burger Menu ───────────────────────────────────────────────────────────────
function BurgerMenu({ page, setPage, user, onLogout, open, setOpen }) {
  if (!open) return null;
  const items = [
    { id:"home", icon:"🏠", label:"Home" },
    { id:"program", icon:"📋", label:"Program" },
    { id:"calendar", icon:"📅", label:"Calendar" },
    { id:"setlist", icon:"🎸", label:"Setlist" },
  ];
  return (
    <>
      <div className="menu-backdrop" onClick={() => setOpen(false)} />
      <div className="menu-drawer">
        <div className="menu-header">
          <div className="menu-user-name">{user.firstName} {user.lastName}</div>
          <div className="menu-user-role">{user.role === "editor" ? "✏️ Editor" : "👁 Viewer"}</div>
          <div className="menu-user-email">{user.email}</div>
        </div>
        <div className="menu-items">
          {items.map(item => (
            <button key={item.id}
              className={`menu-item ${page===item.id?"active":""}`}
              onClick={() => { setPage(item.id); setOpen(false); }}>
              <span className="menu-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="menu-footer">
          <button className="menu-logout" onClick={onLogout}>🚪 Log Out</button>
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
      <div style={{width:44}} />
    </div>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
function HomePage({ user, setPage, programs, events }) {
  const recentProgram = programs.length > 0 ? programs[programs.length - 1] : null;
  const today = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date + "T00:00:00") >= new Date(today.toDateString()))
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const widgets = [
    { id:"program", icon:"📋", label:"Program", desc:recentProgram ? recentProgram.title : "No programs yet", color:"#E8621A" },
    { id:"calendar", icon:"📅", label:"Calendar", desc:upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming event${upcomingEvents.length>1?"s":""}` : "No upcoming events", color:"#2563EB" },
    { id:"setlist", icon:"🎸", label:"Setlist", desc:recentProgram ? `${recentProgram.items.filter(i=>i.type==="song"&&i.songId).length} songs` : "No songs yet", color:"#2E7D4F" },
  ];

  return (
    <div className="home-wrap">
      <div className="home-greeting">{getGreeting(user.firstName)}</div>
      <div className="home-date">{today.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      {recentProgram && (
        <div className="home-recent">
          <div className="home-recent-label">Current Service</div>
          <div className="home-recent-title">{recentProgram.title}</div>
          <div className="home-recent-meta">{recentProgram.date}{recentProgram.time ? ` · ${recentProgram.time}` : ""}</div>
        </div>
      )}
      <div className="home-widgets">
        {widgets.map(w => (
          <button key={w.id} className="widget-card" onClick={() => setPage(w.id)}
            style={{"--wcolor": w.color}}>
            <div className="widget-icon">{w.icon}</div>
            <div className="widget-label">{w.label}</div>
            <div className="widget-desc">{w.desc}</div>
            <div className="widget-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [songs, setSongs] = useState(SAMPLE_SONGS);
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [events, setEvents] = useState(SAMPLE_EVENTS);

  // Setlist always mirrors most recent program's songs
  const recentProgram = programs.length > 0 ? programs[programs.length - 1] : null;
  const setlist = recentProgram
    ? recentProgram.items.filter(i => i.type === "song" && i.songId).map(i => i.songId)
    : [];

  const pageTitles = { home:"Home", program:"Program", calendar:"Calendar", setlist:"Setlist" };

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Lato:wght@300;400;700&family=Courier+Prime:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #F5F0E8; --panel: #FFFFFF; --border: #E8E0D0;
          --accent: #E8621A; --accent2: #FF7A30; --accent-light: rgba(232,98,26,0.08);
          --text: #1A1A1A; --muted: #888070; --chord: #E8621A; --lyric: #3A3530;
          --danger: #DC3545; --green: #2E7D4F; --blue: #2563EB;
          --shadow-sm: 0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.10),0 1px 4px rgba(0,0,0,0.06);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.08);
        }
        html, body, #root { height: 100%; }
        body { background: var(--bg); color: var(--text); font-family: 'Lato', sans-serif; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }

        /* ── Splash ── */
        .splash { position: fixed; inset: 0; background: #0f0e0d; display: flex; align-items: center; justify-content: center; z-index: 999; transition: opacity .6s ease; }
        .splash-fade { opacity: 0; pointer-events: none; }
        .splash-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .splash-logo { animation: splashPop .6s ease forwards; }
        .splash-title { font-family: 'Montserrat', sans-serif; font-size: 2.4rem; font-weight: 900; color: #f0ebe3; letter-spacing: -0.02em; }
        .splash-sub { font-size: 0.95rem; color: #7a7268; letter-spacing: 0.05em; }
        @keyframes splashPop { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }

        /* ── Auth ── */
        .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg); }
        .auth-card { background: var(--panel); border-radius: 20px; padding: 32px 28px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
        .auth-logo { display: flex; justify-content: center; margin-bottom: 8px; }
        .auth-title { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 900; text-align: center; color: var(--text); }
        .auth-sub { font-size: 0.8rem; color: var(--muted); text-align: center; margin-bottom: 24px; letter-spacing: 0.04em; }
        .auth-tabs { display: flex; background: var(--bg); border-radius: 10px; padding: 3px; margin-bottom: 20px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); }
        .auth-tab { flex: 1; padding: 10px; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700; background: transparent; color: var(--muted); transition: all .15s; }
        .auth-tab.active { background: var(--accent); color: white; box-shadow: var(--shadow-sm); }
        .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .auth-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
        .auth-field label { font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .auth-field input { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 0.95rem; color: var(--text); outline: none; transition: border-color .15s; width: 100%; }
        .auth-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
        .auth-error { background: #FEE2E2; color: var(--danger); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 12px; }
        .auth-btn { width: 100%; padding: 14px; background: var(--accent); color: white; border: none; border-radius: 10px; font-family: 'Montserrat', sans-serif; font-size: 0.88rem; font-weight: 700; letter-spacing: 0.04em; transition: background .15s; box-shadow: var(--shadow-md); margin-bottom: 14px; }
        .auth-btn:hover { background: var(--accent2); }
        .auth-hint { text-align: center; font-size: 0.82rem; color: var(--muted); }
        .auth-link { background: none; border: none; color: var(--accent); font-weight: 700; font-size: 0.82rem; text-decoration: underline; }

        /* ── Shell ── */
        .app-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        /* ── Topbar ── */
        .topbar { background: var(--panel); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: space-between; height: 54px; padding: 0 12px; flex-shrink: 0; z-index: 10; }
        .burger-btn { width: 44px; height: 44px; border: none; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border-radius: 10px; transition: background .15s; }
        .burger-btn:hover { background: var(--bg); }
        .burger-btn span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }
        .topbar-title { font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 900; color: var(--text); }

        /* ── Burger Menu ── */
        .menu-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 90; backdrop-filter: blur(2px); }
        .menu-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 280px; background: var(--panel); z-index: 91; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; animation: slideIn .2s ease; }
        @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        .menu-header { padding: 48px 24px 20px; background: var(--accent); }
        .menu-user-name { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 900; color: white; }
        .menu-user-role { font-size: 0.78rem; color: rgba(255,255,255,0.8); margin: 4px 0 2px; }
        .menu-user-email { font-size: 0.72rem; color: rgba(255,255,255,0.65); }
        .menu-items { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
        .menu-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: none; background: transparent; border-radius: 10px; font-size: 0.95rem; font-weight: 600; color: var(--text); transition: all .15s; text-align: left; }
        .menu-item:hover { background: var(--accent-light); color: var(--accent); }
        .menu-item.active { background: var(--accent-light); color: var(--accent); font-weight: 700; }
        .menu-item-icon { font-size: 1.3rem; width: 28px; text-align: center; }
        .menu-footer { padding: 16px; border-top: 1px solid var(--border); }
        .menu-logout { width: 100%; padding: 12px; border: 1.5px solid var(--border); background: transparent; border-radius: 10px; font-size: 0.85rem; font-weight: 700; color: var(--muted); transition: all .15s; }
        .menu-logout:hover { border-color: var(--danger); color: var(--danger); background: #FEE2E2; }

        /* ── Home ── */
        .home-wrap { flex: 1; overflow-y: auto; padding: 24px 20px 32px; max-width: 600px; margin: 0 auto; width: 100%; }
        .home-greeting { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 900; color: var(--text); margin-bottom: 4px; }
        .home-date { font-size: 0.82rem; color: var(--muted); margin-bottom: 20px; }
        .home-recent { background: var(--panel); border-radius: 14px; padding: 16px 18px; margin-bottom: 24px; box-shadow: var(--shadow-md); border-left: 4px solid var(--accent); }
        .home-recent-label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
        .home-recent-title { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 900; color: var(--text); }
        .home-recent-meta { font-size: 0.78rem; color: var(--muted); margin-top: 3px; }
        .home-widgets { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .widget-card { background: var(--panel); border-radius: 16px; padding: 20px 18px; border: none; text-align: left; box-shadow: var(--shadow-md); transition: all .18s; display: flex; flex-direction: column; gap: 6px; position: relative; overflow: hidden; min-height: 130px; border-top: 4px solid var(--wcolor, var(--accent)); }
        .widget-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
        .widget-icon { font-size: 1.8rem; }
        .widget-label { font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 900; color: var(--text); }
        .widget-desc { font-size: 0.72rem; color: var(--muted); flex: 1; }
        .widget-arrow { font-size: 1.1rem; color: var(--wcolor, var(--accent)); font-weight: 700; align-self: flex-end; }

        /* Shared page elements */
        .page-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

        /* Buttons */
        .btn-primary { padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 9px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); }
        .btn-primary:hover { background: var(--accent2); }
        .btn-ghost { padding: 10px 18px; background: white; color: var(--muted); border: 1.5px solid var(--border); border-radius: 9px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .btn-full { width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 9px; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: background .15s; }
        .btn-full:hover { background: var(--accent2); }
        .pill-btn { padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: white; color: var(--muted); font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; box-shadow: var(--shadow-sm); }
        .pill-btn:hover { border-color: var(--text); color: var(--text); }
        .pill-btn.accent { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .pill-btn.accent:hover { background: var(--accent); color: white; }
        .pill-btn.green { border-color: var(--green); color: var(--green); }
        .pill-btn.green:hover { background: var(--green); color: white; }
        .pill-badge { padding: 3px 8px; border-radius: 20px; background: #D1FAE5; color: var(--green); font-size: 0.68rem; font-weight: 700; }

        .toggle-group { display: flex; gap: 3px; padding: 3px; background: var(--bg); border-radius: 9px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08); }
        .toggle-btn { padding: 6px 12px; border: none; border-radius: 7px; font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; background: transparent; color: var(--muted); text-transform: uppercase; transition: all .15s; min-height: 36px; }
        .toggle-btn:hover { color: var(--accent); }
        .toggle-btn.active { background: white; color: var(--accent); box-shadow: var(--shadow-sm); }

        .btn-icon { width: 36px; height: 36px; background: white; border: 1.5px solid var(--border); border-radius: 8px; color: var(--text); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; box-shadow: var(--shadow-sm); flex-shrink: 0; }
        .btn-icon:hover { border-color: var(--accent); color: var(--accent); }
        .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--border); background: white; color: var(--muted); cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; transition: all .12s; box-shadow: var(--shadow-sm); flex-shrink: 0; }
        .icon-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); background: #FEE2E2; }
        .icon-btn:disabled { opacity: .25; cursor: default; box-shadow: none; }

        .transpose-label { font-family: 'Montserrat', sans-serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
        .semitone-display { font-family: 'Courier Prime', monospace; font-size: 1rem; color: var(--accent); font-weight: 700; min-width: 34px; text-align: center; }

        /* Sidebar/list shared */
        .sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--panel); flex-shrink: 0; }
        .sidebar-tab { flex: 1; padding: 14px 8px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; color: var(--muted); border: none; background: transparent; border-bottom: 2px solid transparent; transition: all .15s; min-height: 50px; }
        .sidebar-tab:hover { color: var(--accent); }
        .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 8px; background: var(--bg); }
        .sidebar-list::-webkit-scrollbar { width: 4px; }
        .sidebar-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .sidebar-footer { padding: 10px; border-top: 1px solid var(--border); background: var(--panel); }

        .song-row { display: flex; align-items: center; gap: 8px; padding: 12px 10px; border-radius: 10px; cursor: pointer; margin-bottom: 5px; border: 1.5px solid transparent; transition: all .12s; background: var(--panel); box-shadow: var(--shadow-sm); min-height: 56px; }
        .song-row:hover { border-color: var(--accent); box-shadow: var(--shadow-md); }
        .song-row.active { border-color: var(--accent); background: var(--accent-light); }
        .song-row.drag-over { border-color: var(--accent); background: var(--accent-light); }
        .drag-handle { color: var(--muted); cursor: grab; opacity: 0; transition: opacity .15s; font-size: 0.9rem; }
        .song-row:hover .drag-handle { opacity: 1; }
        .song-row-num { font-family: 'Courier Prime', monospace; font-size: 0.75rem; color: var(--muted); min-width: 18px; text-align: right; }
        .song-row-info { flex: 1; min-width: 0; }
        .song-row-title { font-size: 0.88rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-row-meta { font-size: 0.72rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-row-key { font-family: 'Courier Prime', monospace; font-size: 0.72rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1px solid rgba(232,98,26,0.2); padding: 3px 7px; border-radius: 5px; flex-shrink: 0; }
        .song-row-actions { display: flex; gap: 4px; }
        .row-btn { width: 34px; height: 34px; border-radius: 7px; border: none; background: transparent; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all .12s; }
        .row-btn:hover { background: var(--bg); color: var(--text); }
        .row-btn.danger:hover { background: #FEE2E2; color: var(--danger); }
        .row-btn.add:hover { background: #D1FAE5; color: var(--green); }
        .row-btn.remove:hover { background: #FEE2E2; color: var(--danger); }

        .main { overflow-y: auto; padding: 20px; background: var(--bg); }
        .main::-webkit-scrollbar { width: 5px; }
        .main::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--muted); gap: 8px; }
        .empty-icon { font-size: 2.5rem; opacity: 0.2; }
        .empty-text { font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 700; }
        .empty-sub { font-size: 0.82rem; }
        .empty-sidebar { color: var(--muted); font-size: 0.78rem; text-align: center; padding: 20px 8px; }

        /* Song display */
        .song-display { max-width: 680px; }
        .song-display-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid var(--border); }
        .song-display-title { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 900; line-height: 1.1; }
        .song-display-artist { color: var(--muted); font-size: 0.85rem; margin-top: 3px; }
        .key-badge { font-family: 'Courier Prime', monospace; font-size: 0.9rem; font-weight: 700; color: var(--accent); background: var(--accent-light); border: 1.5px solid rgba(232,98,26,0.25); padding: 6px 12px; border-radius: 8px; min-width: 48px; text-align: center; box-shadow: var(--shadow-sm); }
        .song-content { font-family: 'Courier Prime', monospace; font-size: 0.9rem; line-height: 1.5; }
        .chord-line { color: var(--chord); font-weight: 700; white-space: pre; margin-bottom: 2px; }
        .lyric-line { color: var(--lyric); white-space: pre; margin-bottom: 10px; }

        /* Editor */
        .editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; backdrop-filter: blur(4px); }
        .editor-card { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 600px; max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .editor-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 900; margin-bottom: 16px; color: var(--accent); }
        .editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .editor-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
        .editor-field-sm { max-width: 180px; }
        .editor-field label { font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .label-hint { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: 0.6rem; }
        .editor-field input, .editor-field select, .editor-field textarea { background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 0.88rem; outline: none; transition: border-color .15s; width: 100%; }
        .editor-field textarea { font-family: 'Courier Prime', monospace; resize: vertical; }
        .editor-field input:focus, .editor-field select:focus, .editor-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.1); }
        .editor-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }

        /* Program page */
        .program-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .program-body { flex: 1; overflow: hidden; display: grid; grid-template-columns: 280px 1fr; }
        .prog-details { background: var(--panel); border-right: 1px solid var(--border); padding: 16px; overflow-y: auto; }
        .prog-details::-webkit-scrollbar { width: 4px; }
        .prog-details::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .prog-section-title { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .prog-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .prog-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .prog-field label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); }
        .prog-field input, .prog-field textarea, .prog-field select { background: var(--bg); border: 1.5px solid var(--border); border-radius: 8px; padding: 9px 11px; color: var(--text); font-size: 0.85rem; outline: none; transition: all .15s; width: 100%; }
        .prog-field input:focus, .prog-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,98,26,0.1); }
        .prog-field textarea { resize: vertical; }
        .prog-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .prog-toolbar-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; flex-wrap: wrap; }
        .prog-sync-info { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
        .prog-order { overflow-y: auto; padding: 16px 18px; background: var(--bg); }
        .prog-order::-webkit-scrollbar { width: 4px; }
        .prog-order::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .prog-items-list { display: flex; flex-direction: column; gap: 7px; margin-top: 4px; }
        .prog-item { display: flex; align-items: flex-start; gap: 8px; background: white; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; transition: all .15s; box-shadow: var(--shadow-sm); }
        .prog-item.song { border-left: 4px solid var(--accent); }
        .prog-item.section { border-left: 4px solid var(--blue); }
        .prog-item-left { display: flex; align-items: center; gap: 5px; padding-top: 2px; }
        .prog-num { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--muted); min-width: 16px; text-align: right; }
        .prog-type-badge { font-size: 0.95rem; }
        .prog-item-body { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .prog-item-actions { display: flex; gap: 3px; flex-shrink: 0; }
        .prog-select { background: var(--bg); border: 1.5px solid var(--border); border-radius: 7px; padding: 8px 10px; color: var(--text); font-size: 0.82rem; outline: none; cursor: pointer; width: 100%; transition: all .15s; }
        .prog-select:focus { border-color: var(--accent); }
        .prog-input { background: var(--bg); border: 1.5px solid var(--border); border-radius: 7px; padding: 8px 10px; color: var(--text); font-size: 0.82rem; outline: none; width: 100%; transition: all .15s; }
        .prog-input:focus { border-color: var(--blue); }
        .prog-input-sm { font-size: 0.75rem; color: var(--muted); }
        .prog-song-info { display: flex; flex-direction: column; gap: 4px; }
        .prog-song-meta { font-size: 0.7rem; color: var(--muted); }
        .prog-section-info { display: flex; flex-direction: column; gap: 4px; }
        .setlist-summary { display: flex; flex-direction: column; gap: 3px; }
        .summary-row { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 7px; background: var(--bg); border: 1px solid var(--border); min-height: 36px; }
        .summary-num { font-family: 'Courier Prime', monospace; font-size: 0.68rem; color: var(--muted); min-width: 16px; text-align: right; }
        .summary-title { flex: 1; font-size: 0.78rem; font-weight: 700; }
        .summary-key { font-family: 'Courier Prime', monospace; font-size: 0.68rem; color: var(--accent); background: var(--accent-light); border: 1px solid rgba(232,98,26,0.2); padding: 1px 5px; border-radius: 4px; }

        /* Preview */
        .preview-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px; background: var(--panel); box-shadow: var(--shadow-sm); flex-shrink: 0; gap: 8px; flex-wrap: wrap; }
        .preview-doc { flex: 1; overflow-y: auto; padding: 32px 24px; max-width: 680px; margin: 0 auto; width: 100%; }
        .preview-church { font-family: 'Montserrat', sans-serif; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--muted); margin-bottom: 6px; }
        .preview-title { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 900; color: var(--accent); margin-bottom: 3px; }
        .preview-date { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }
        .preview-sermon { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; box-shadow: var(--shadow-sm); }
        .preview-sermon-title { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 3px; }
        .preview-speaker { font-size: 0.8rem; color: var(--muted); }
        .preview-scripture { font-size: 0.82rem; color: var(--muted); margin-bottom: 14px; font-style: italic; }
        .preview-scripture-label { font-style: normal; font-weight: 700; color: var(--text); }
        .preview-divider { border: none; border-top: 2px solid var(--border); margin: 16px 0; }
        .preview-items { display: flex; flex-direction: column; gap: 6px; }
        .preview-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 13px; border-radius: 9px; background: white; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .preview-item.song { border-left: 4px solid var(--accent); }
        .preview-item.section { border-left: 4px solid var(--blue); }
        .preview-item-num { font-family: 'Courier Prime', monospace; font-size: 0.7rem; color: var(--muted); min-width: 18px; padding-top: 2px; }
        .preview-item-song { font-weight: 700; font-size: 0.9rem; }
        .preview-item-meta { font-size: 0.75rem; color: var(--muted); }
        .preview-item-section { font-size: 0.85rem; font-weight: 700; }
        .preview-item-note { font-size: 0.75rem; color: var(--muted); font-style: italic; }
        .preview-notes { font-size: 0.8rem; color: var(--muted); line-height: 1.6; }

        /* Setlist controls */
        .sl-controls { background: var(--panel); box-shadow: var(--shadow-sm); flex-shrink: 0; z-index: 5; }
        .sl-ctrl-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; flex-wrap: wrap; border-bottom: 1px solid var(--border); }
        .sl-ctrl-row:last-child { border-bottom: none; }
        .ctrl-song-name { flex: 1; font-size: 0.75rem; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

        /* Mobile song nav */
        .mobile-song-back { padding: 10px 14px; background: var(--panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-sm); flex-shrink: 0; }
        .mobile-song-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: stretch; background: white; border-top: 2px solid var(--border); box-shadow: 0 -4px 16px rgba(0,0,0,0.1); min-height: 70px; z-index: 50; }
        .msn-btn { flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border: none; background: transparent; color: var(--text); cursor: pointer; transition: background .15s; }
        .msn-btn:disabled { opacity: .25; cursor: default; }
        .msn-btn:not(:disabled):hover { background: var(--accent-light); }
        .msn-right { justify-content: flex-end; border-left: 1px solid var(--border); }
        .msn-arrow { font-size: 2.2rem; color: var(--accent); font-weight: 300; line-height: 1; flex-shrink: 0; }
        .msn-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .msn-counter { font-family: 'Courier Prime', monospace; font-size: 0.75rem; color: var(--muted); padding: 0 10px; display: flex; align-items: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); white-space: nowrap; }

        .desktop-song-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding-top: 18px; border-top: 2px solid var(--border); gap: 12px; }
        .dsn-btn { flex: 1; padding: 12px 16px; background: white; border: 1.5px solid var(--border); border-radius: 10px; color: var(--text); font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all .15s; box-shadow: var(--shadow-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dsn-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .dsn-btn:disabled { opacity: .3; cursor: default; }

        .btn-perform { padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s; box-shadow: 0 2px 8px rgba(232,98,26,0.3); flex-shrink: 0; }
        .btn-perform:hover { background: var(--accent2); }

        /* Calendar page */
        .cal-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .cal-header { background: var(--panel); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); box-shadow: var(--shadow-sm); flex-shrink: 0; gap: 10px; }
        .cal-month-nav { display: flex; align-items: center; gap: 10px; }
        .cal-month-label { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 900; color: var(--text); min-width: 160px; text-align: center; }
        .cal-grid-wrap { flex: 1; overflow-y: auto; padding: 14px 16px; }
        .cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
        .cal-day-label { text-align: center; font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 4px 0; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .cal-cell { min-height: 70px; background: var(--panel); border-radius: 8px; padding: 6px; border: 1.5px solid var(--border); cursor: pointer; transition: all .12s; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
        .cal-cell:hover { border-color: var(--accent); }
        .cal-cell.other-month { background: transparent; border-color: transparent; box-shadow: none; opacity: .4; }
        .cal-cell.today { border-color: var(--accent); background: var(--accent-light); }
        .cal-cell.today .cal-cell-num { color: var(--accent); font-weight: 900; }
        .cal-cell-num { font-family: 'Courier Prime', monospace; font-size: 0.82rem; color: var(--text); margin-bottom: 3px; }
        .cal-event-dot { font-size: 0.62rem; background: var(--accent); color: white; border-radius: 4px; padding: 1px 5px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
        .cal-add-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; background: var(--accent); color: white; border: none; border-radius: 50%; font-size: 1.6rem; box-shadow: var(--shadow-lg); z-index: 30; transition: all .15s; }
        .cal-add-fab:hover { background: var(--accent2); transform: scale(1.08); }
        .cal-events-list { margin-top: 16px; }
        .cal-event-card { background: var(--panel); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; box-shadow: var(--shadow-sm); border-left: 4px solid; display: flex; align-items: flex-start; gap: 10px; }
        .cal-event-info { flex: 1; min-width: 0; }
        .cal-event-title { font-weight: 700; font-size: 0.88rem; }
        .cal-event-meta { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }
        .cal-event-actions { display: flex; gap: 4px; }

        /* Page header bar */
        .page-header { background: var(--panel); box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 10px; padding: 8px 14px; flex-shrink: 0; flex-wrap: wrap; z-index: 5; }

        /* Responsive desktop layout for setlist/program */
        .page-body { flex: 1; display: none; }
        @media (min-width: 768px) {
          .page-body { display: grid; grid-template-columns: 260px 1fr; overflow: hidden; }
          .program-body { grid-template-columns: 260px 1fr; }
        }

        /* Fullscreen performance mode */
        .fs-overlay { position: fixed; inset: 0; z-index: 200; background: #0f0e0d; display: flex; flex-direction: column; touch-action: none; }
        .fs-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #1a1917; border-bottom: 1px solid #2e2b28; flex-shrink: 0; flex-wrap: wrap; }
        .fs-close-btn { padding: 10px 16px; background: #2e2b28; border: none; border-radius: 10px; color: #f0ebe3; font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; min-height: 44px; }
        .fs-close-btn:hover { background: #E8621A; }
        .fs-song-info { flex: 1; min-width: 0; }
        .fs-title { display: block; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 900; color: #f0ebe3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fs-artist { font-size: 0.7rem; color: #7a7268; }
        .fs-key-badge { font-family: 'Courier Prime', monospace; font-size: 0.88rem; font-weight: 700; color: #E8621A; background: rgba(232,98,26,0.12); border: 1px solid rgba(232,98,26,0.3); padding: 6px 12px; border-radius: 7px; white-space: nowrap; }
        .fs-counter { font-family: 'Courier Prime', monospace; font-size: 0.78rem; color: #7a7268; white-space: nowrap; }
        .fs-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px; }
        .fs-content::-webkit-scrollbar { width: 5px; }
        .fs-content::-webkit-scrollbar-thumb { background: #2e2b28; border-radius: 3px; }
        .fs-zoom-bar { display: flex; align-items: center; gap: 6px; padding: 6px 16px; background: #1a1917; border-bottom: 1px solid #2e2b28; flex-shrink: 0; }
        .fs-zoom-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7268; font-family: 'Montserrat', sans-serif; }
        .fs-zoom-val { font-family: 'Courier Prime', monospace; font-size: 0.8rem; color: #E8621A; min-width: 40px; text-align: center; }
        .fs-lines { max-width: 100%; }
        .fs-chord-line { font-family: 'Courier Prime', monospace; color: #E8621A; font-weight: 700; white-space: pre-wrap; word-break: break-word; margin-bottom: 2px; line-height: 1.5; }
        .fs-lyric-line { font-family: 'Courier Prime', monospace; color: #d4ccbf; white-space: pre-wrap; word-break: break-word; margin-bottom: 10px; line-height: 1.6; }
        .fs-nav { display: flex; align-items: stretch; background: #1a1917; border-top: 1px solid #2e2b28; flex-shrink: 0; min-height: 80px; }
        .fs-nav-btn { flex: 1; display: flex; align-items: center; gap: 10px; padding: 14px 18px; border: none; background: transparent; color: #f0ebe3; cursor: pointer; transition: background .15s; min-height: 80px; }
        .fs-nav-btn:disabled { opacity: .25; cursor: default; }
        .fs-nav-btn:not(:disabled):hover { background: rgba(232,98,26,0.1); }
        .fs-prev { justify-content: flex-start; border-right: 1px solid #2e2b28; }
        .fs-next { justify-content: flex-end; }
        .fs-nav-arrow { font-size: 3rem; font-weight: 300; line-height: 1; color: #E8621A; flex-shrink: 0; }
        .fs-nav-label { font-size: 0.78rem; font-weight: 700; color: #7a7268; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .fs-dots { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 12px; flex-shrink: 0; flex-wrap: wrap; max-width: 160px; }
        .fs-dot { width: 9px; height: 9px; border-radius: 50%; border: none; background: #2e2b28; cursor: pointer; transition: all .15s; padding: 0; }
        .fs-dot.active { background: #E8621A; transform: scale(1.3); }

        @media print {
          .topbar, .preview-toolbar { display: none !important; }
          body { background: white !important; color: black !important; }
          .preview-doc { padding: 20px; max-width: 100%; }
          .preview-title { color: #E8621A !important; }
          .preview-item { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div className="app-shell">
        <TopBar title={pageTitles[page] || "CenterStage"} onBurger={() => setMenuOpen(true)} />
        <BurgerMenu page={page} setPage={setPage} user={user} onLogout={() => { setUser(null); setPage("home"); }} open={menuOpen} setOpen={setMenuOpen} />
        <div className="page-content">
          {page === "home" && <HomePage user={user} setPage={setPage} programs={programs} events={events} />}
          {page === "program" && <ProgramPage songs={songs} setSongs={setSongs} programs={programs} setPrograms={setPrograms} user={user} />}
          {page === "setlist" && <SetlistPage songs={songs} setSongs={setSongs} setlist={setlist} setSetlist={() => {}} user={user} />}
          {page === "calendar" && <CalendarPage events={events} setEvents={setEvents} user={user} />}
        </div>
      </div>
    </>
  );
}
