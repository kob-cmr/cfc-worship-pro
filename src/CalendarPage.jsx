import { useState } from "react";

const EVENT_COLORS = [
  { label:"Orange", value:"#E8621A" },
  { label:"Blue",   value:"#2563EB" },
  { label:"Green",  value:"#2E7D4F" },
  { label:"Purple", value:"#7C3AED" },
  { label:"Red",    value:"#DC3545" },
  { label:"Teal",   value:"#0D9488" },
];

function EventModal({ event, onSave, onDelete, onCancel }) {
  const isNew = !event.id;
  const [form, setForm] = useState({
    title:"", date:"", time:"", endTime:"", color:"#E8621A", description:"", location:"", ...event
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div className="editor-overlay">
      <div className="editor-card">
        <h2 className="editor-title">{isNew ? "New Event" : "Edit Event"}</h2>
        <div className="editor-field">
          <label>Event Title</label>
          <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Music Team Rehearsal"/>
        </div>
        <div className="editor-row">
          <div className="editor-field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}/>
          </div>
          <div className="editor-field">
            <label>Location</label>
            <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Main Hall"/>
          </div>
        </div>
        <div className="editor-row">
          <div className="editor-field">
            <label>Start Time</label>
            <input type="time" value={form.time} onChange={e=>set("time",e.target.value)}/>
          </div>
          <div className="editor-field">
            <label>End Time</label>
            <input type="time" value={form.endTime} onChange={e=>set("endTime",e.target.value)}/>
          </div>
        </div>
        <div className="editor-field">
          <label>Description</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} placeholder="Details about this event..."/>
        </div>
        <div className="editor-field">
          <label>Color</label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"4px"}}>
            {EVENT_COLORS.map(c=>(
              <button key={c.value}
                onClick={()=>set("color",c.value)}
                style={{width:32,height:32,borderRadius:"50%",background:c.value,border:form.color===c.value?"3px solid #1A1A1A":"3px solid transparent",cursor:"pointer",transition:"border .15s"}}
                title={c.label}/>
            ))}
          </div>
        </div>
        <div className="editor-actions" style={{justifyContent:"space-between"}}>
          <div>
            {!isNew && <button className="btn-ghost" style={{color:"var(--danger)",borderColor:"var(--danger)"}} onClick={()=>onDelete(event.id)}>Delete</button>}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={()=>{ if(!form.title||!form.date)return; onSave(form); }}>Save Event</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayEventsModal({ date, events, onAdd, onEdit, onClose }) {
  const dateStr = date.toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-card" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div className="editor-title" style={{marginBottom:2}}>{dateStr}</div>
            <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{events.length} event{events.length!==1?"s":""}</div>
          </div>
          <button className="btn-ghost" style={{padding:"6px 12px"}} onClick={onClose}>✕</button>
        </div>
        {events.length===0 && <div className="empty-sidebar" style={{padding:"20px 0"}}>No events this day.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:16}}>
          {events.map(ev=>(
            <div key={ev.id} className="cal-event-card" style={{borderLeftColor:ev.color}} onClick={()=>onEdit(ev)}>
              <div className="cal-event-info">
                <div className="cal-event-title">{ev.title}</div>
                <div className="cal-event-meta">
                  {ev.time && `${ev.time}${ev.endTime?` – ${ev.endTime}`:""}`}
                  {ev.location && ` · ${ev.location}`}
                </div>
                {ev.description && <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:3}}>{ev.description}</div>}
              </div>
            </div>
          ))}
        </div>
        <button className="btn-full" onClick={onAdd}>+ Add Event This Day</button>
      </div>
    </div>
  );
}

export default function CalendarPage({ events, setEvents }) {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null); // null | {} | event
  const [showDayModal, setShowDayModal] = useState(false);

  const prevMonth = () => {
    if (currentMonth===0){ setCurrentMonth(11); setCurrentYear(y=>y-1); }
    else setCurrentMonth(m=>m-1);
  };
  const nextMonth = () => {
    if (currentMonth===11){ setCurrentMonth(0); setCurrentYear(y=>y+1); }
    else setCurrentMonth(m=>m+1);
  };

  // Build calendar grid — use explicit year/month/day to avoid timezone shifting
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Build a date key as YYYY-MM-DD without timezone conversion
  const makeDateKey = (y, m, d) => {
    const mm = String(m+1).padStart(2,"0");
    const dd = String(d).padStart(2,"0");
    return `${y}-${mm}-${dd}`;
  };

  const cells = [];
  for(let i=0;i<startDow;i++){
    const d=prevMonthDays-startDow+1+i;
    const m=currentMonth-1<0?11:currentMonth-1;
    const y=currentMonth-1<0?currentYear-1:currentYear;
    cells.push({day:d,current:false,dateKey:makeDateKey(y,m,d),date:new Date(y,m,d)});
  }
  for(let d=1;d<=daysInMonth;d++){
    cells.push({day:d,current:true,dateKey:makeDateKey(currentYear,currentMonth,d),date:new Date(currentYear,currentMonth,d)});
  }
  const remaining=42-cells.length;
  for(let d=1;d<=remaining;d++){
    const m=currentMonth+1>11?0:currentMonth+1;
    const y=currentMonth+1>11?currentYear+1:currentYear;
    cells.push({day:d,current:false,dateKey:makeDateKey(y,m,d),date:new Date(y,m,d)});
  }

  const dateKey = (d) => d.toISOString().split("T")[0];
  const isToday = (cell) => cell.dateKey === makeDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const eventsOnCell = (cell) => events.filter(e => e.date === cell.dateKey);

  const handleCellClick = (cell) => {
    setSelectedDate(cell);
    setShowDayModal(true);
  };

  const handleSaveEvent = (form) => {
    if(form.id){
      setEvents(evs=>evs.map(e=>e.id===form.id?form:e));
    } else {
      setEvents(evs=>[...evs,{...form,id:`ev-${Date.now()}`}]);
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id) => {
    setEvents(evs=>evs.filter(e=>e.id!==id));
    setEditingEvent(null);
    setShowDayModal(false);
  };

  const monthName = firstDay.toLocaleDateString("en-PH",{month:"long",year:"numeric"});
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // Upcoming events list
  const upcoming = events
    .filter(e=>new Date(e.date+"T23:59:59")>=today)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  return (
    <div className="cal-wrap">
      {/* Month nav */}
      <div className="cal-header">
        <div className="cal-month-nav">
          <button className="btn-icon" onClick={prevMonth}>‹</button>
          <div className="cal-month-label">{monthName}</div>
          <button className="btn-icon" onClick={nextMonth}>›</button>
        </div>
        <button className="btn-ghost" onClick={()=>{ setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}>Today</button>
      </div>

      <div className="cal-grid-wrap">
        {/* Day headers */}
        <div className="cal-days-header">
          {DOW.map(d=><div key={d} className="cal-day-label">{d}</div>)}
        </div>

        {/* Grid */}
        <div className="cal-grid">
          {cells.map((cell,i)=>{
            const dayEvents = eventsOnCell(cell);
            return (
              <div key={i}
                className={`cal-cell ${!cell.current?"other-month":""} ${isToday(cell)?"today":""}`}
                onClick={()=>handleCellClick(cell)}>
                <div className="cal-cell-num">{cell.day}</div>
                {dayEvents.slice(0,2).map(ev=>(
                  <div key={ev.id} className="cal-event-dot" style={{background:ev.color}}>{ev.title}</div>
                ))}
                {dayEvents.length>2 && <div style={{fontSize:"0.58rem",color:"var(--muted)",fontWeight:700}}>+{dayEvents.length-2} more</div>}
              </div>
            );
          })}
        </div>

        {/* Upcoming events list */}
        {upcoming.length>0 && (
          <div className="cal-events-list">
            <div className="prog-section-title" style={{marginBottom:10,marginTop:4}}>Upcoming Events</div>
            {upcoming.slice(0,8).map(ev=>(
              <div key={ev.id} className="cal-event-card" style={{borderLeftColor:ev.color}} onClick={()=>setEditingEvent(ev)}>
                <div style={{width:10,height:10,borderRadius:"50%",background:ev.color,flexShrink:0,marginTop:3}}/>
                <div className="cal-event-info">
                  <div className="cal-event-title">{ev.title}</div>
                  <div className="cal-event-meta">
                    {new Date(ev.date+"T00:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"})}
                    {ev.time && ` · ${ev.time}`}
                    {ev.location && ` · ${ev.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB add button */}
      <button className="cal-add-fab" onClick={()=>setEditingEvent({ date: selectedDate ? selectedDate.dateKey : makeDateKey(today.getFullYear(),today.getMonth(),today.getDate()) })}>+</button>

      {/* Day events modal */}
      {showDayModal && selectedDate && !editingEvent && (
        <DayEventsModal
          date={selectedDate.date}
          events={eventsOnCell(selectedDate)}
          onAdd={()=>{ setEditingEvent({ date: selectedDate.dateKey }); setShowDayModal(false); }}
          onEdit={(ev)=>{ setEditingEvent(ev); setShowDayModal(false); }}
          onClose={()=>setShowDayModal(false)}
        />
      )}

      {/* Event editor */}
      {editingEvent && (
        <EventModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onCancel={()=>{ setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
