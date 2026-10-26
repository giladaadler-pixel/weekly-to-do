import { useEffect, useRef, useState } from "react";
import { addDays, formatDayHeading } from "../lib/dates.js";
import { dayRows } from "../lib/today.js";
import { overdueTasks } from "../lib/tasks.js";
import {
  HOURS,
  DAY_MINUTES,
  eventsOn,
  layoutEvents,
  formatHour,
  formatTime12,
  formatLength,
  scheduledMinutes,
} from "../lib/schedule.js";
import DayTaskList from "./DayTaskList.jsx";
import OverdueSection from "./OverdueSection.jsx";
import TaskModal from "./TaskModal.jsx";
import EventModal from "./EventModal.jsx";
import Icon from "./Icons.jsx";

// Height of one hour on the calendar, in pixels.
export const HOUR_PX = 56;

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// One day as a full 24-hour calendar, like Google Calendar. Tap an empty spot to add an
// event there; tap an event to see or delete it. The day's tasks sit beside it.
// eventActions: { add({ date, start, length, title }), remove(id) }
export default function DayPage({
  date,
  todayIso,
  tasks,
  repeats,
  events,
  streakDays = 0,
  taskActions,
  repeatActions,
  eventActions,
  onDate,
  onBack,
}) {
  const [newAt, setNewAt] = useState(null); // start minute of the event being created
  const [openEvent, setOpenEvent] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [now, setNow] = useState(nowMinutes);
  const scrollRef = useRef(null);
  const dayEvents = eventsOn(events, date);
  const rows = dayRows(tasks, repeats, date);
  const doneCount = rows.filter((r) => r.done).length;
  const isToday = date === todayIso;
  const minutes = scheduledMinutes(dayEvents);

  // Keep the red "now" line moving.
  useEffect(() => {
    const timer = setInterval(() => setNow(nowMinutes()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Open scrolled to just before now (today) or to 7 AM, instead of midnight.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const minute = isToday ? Math.max(0, nowMinutes() - 90) : 7 * 60;
    el.scrollTop = (minute / 60) * HOUR_PX;
  }, [date, isToday]);

  // Tapped spot → start time, rounded down to the half hour.
  function onGridClick(e) {
    if (e.target.closest(".cal-event")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minute = ((e.clientY - rect.top) / HOUR_PX) * 60;
    setNewAt(Math.min(DAY_MINUTES - 30, Math.max(0, Math.floor(minute / 30) * 30)));
  }

  function createNow() {
    const base = isToday ? Math.ceil(nowMinutes() / 30) * 30 : 9 * 60;
    setNewAt(Math.min(DAY_MINUTES - 30, base));
  }

  return (
    <main className="day-page">
      <header className="day-page-header">
        <div className="day-page-nav">
          <button className="ghost-button" onClick={onBack}>
            <Icon name="prev" size={16} /> Week
          </button>
          <button className="square-button" onClick={() => onDate(addDays(date, -1))} aria-label="Previous day">
            <Icon name="prev" />
          </button>
          <button className="square-button" onClick={() => onDate(addDays(date, 1))} aria-label="Next day">
            <Icon name="next" />
          </button>
          <div className="day-page-title">
            <span className="kicker">
              {isToday ? "Today" : "Day view"}
              {isToday && streakDays > 0 && ` · 🔥 ${streakDays}-day streak`}
            </span>
            <h1>{formatDayHeading(date)}</h1>
          </div>
          {!isToday && (
            <button className="ghost-button" onClick={() => onDate(todayIso)}>
              Today
            </button>
          )}
        </div>
        <div className="day-page-actions">
          <span className="mono muted">
            {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"} · {minutes ? formatLength(minutes) : "0h"}
          </span>
          <button className="accent-button" onClick={createNow}>
            + Event
          </button>
        </div>
      </header>

      <div className="day-page-body">
        <section className="calendar panel" aria-label="Day calendar" ref={scrollRef}>
          <div className="cal-inner" style={{ height: 24 * HOUR_PX }}>
            <div className="cal-gutter" aria-hidden="true">
              {HOURS.map((h) => (
                <span key={h} className="cal-hour-label mono" style={{ top: h * HOUR_PX }}>
                  {h === 0 ? "" : formatHour(h)}
                </span>
              ))}
            </div>
            <div className="cal-grid" onClick={onGridClick} data-testid="cal-grid">
              {HOURS.map((h) => (
                <div key={h} className="cal-hour" style={{ top: h * HOUR_PX, height: HOUR_PX }} data-hour={h} />
              ))}
              {newAt !== null && (
                <div className="cal-ghost" style={{ top: (newAt / 60) * HOUR_PX, height: HOUR_PX }}>
                  {formatTime12(newAt)}
                </div>
              )}
              {layoutEvents(dayEvents).map(({ event, col, cols }) => {
                const short = event.length < 45;
                return (
                  <button
                    key={event.id}
                    className={`cal-event${short ? " short" : ""}`}
                    style={{
                      top: (event.start / 60) * HOUR_PX + 1,
                      height: Math.max(18, (event.length / 60) * HOUR_PX - 2),
                      left: `calc(${(col / cols) * 100}% + 2px)`,
                      width: `calc(${100 / cols}% - 6px)`,
                    }}
                    onClick={() => setOpenEvent(event)}
                    aria-label={`${event.title}, ${formatTime12(event.start)}`}
                  >
                    <span className="cal-event-title">{event.title}</span>
                    <span className="cal-event-time mono">
                      {formatTime12(event.start)}
                      {!short && ` – ${formatTime12(event.start + event.length)}`}
                    </span>
                  </button>
                );
              })}
              {isToday && (
                <div className="cal-now" style={{ top: (now / 60) * HOUR_PX }} aria-label="Now">
                  <span className="cal-now-dot" />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="day-page-side">
          <section className="panel day-tasks" aria-label="Tasks">
            <div className="day-tasks-head">
              <h2 className="kicker">
                Tasks · {doneCount}/{rows.length}
              </h2>
              <button className="create-button create-task" onClick={() => setCreatingTask(true)}>
                + Add task
              </button>
            </div>
            {rows.length ? (
              <DayTaskList rows={rows} date={date} taskActions={taskActions} repeatActions={repeatActions} />
            ) : (
              <p className="muted">No tasks for this day.</p>
            )}
            {isToday && (
              <OverdueSection
                tasks={overdueTasks(tasks, todayIso)}
                repeats={repeats}
                todayIso={todayIso}
                taskActions={taskActions}
                repeatActions={repeatActions}
              />
            )}
          </section>
        </div>
      </div>

      {newAt !== null && (
        <EventModal
          start={newAt}
          onCancel={() => setNewAt(null)}
          onSave={(fields) => {
            eventActions.add({ ...fields, date });
            setNewAt(null);
          }}
        />
      )}
      {openEvent && (
        <EventModal
          event={openEvent}
          onCancel={() => setOpenEvent(null)}
          onDelete={() => {
            eventActions.remove(openEvent.id);
            setOpenEvent(null);
          }}
        />
      )}
      {creatingTask && (
        <TaskModal
          onCancel={() => setCreatingTask(false)}
          onCreate={(text, priority, days) => {
            taskActions.add(text, date, priority, days);
            setCreatingTask(false);
          }}
        />
      )}
    </main>
  );
}
