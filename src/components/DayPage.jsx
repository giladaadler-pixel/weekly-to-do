import { useEffect, useRef, useState } from "react";
import { addDays, formatDayHeading } from "../lib/dates.js";
import { dayRows } from "../lib/today.js";
import {
  HOURS,
  DAY_MINUTES,
  eventsOn,
  eventsInHour,
  formatTime,
  formatLength,
  scheduledMinutes,
} from "../lib/schedule.js";
import DayTaskList from "./DayTaskList.jsx";
import Icon from "./Icons.jsx";

// One day, hour by hour. Tapping an hour sets the new block's start time; the form on
// the side adds the block. The day's tasks sit under the form.
// eventActions: { add({ date, start, length, title }), remove(id) }
export default function DayPage({
  date,
  todayIso,
  tasks,
  repeats,
  events,
  taskActions,
  repeatActions,
  eventActions,
  onDate,
  onBack,
}) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(9 * 60);
  const [length, setLength] = useState(60);
  const gridRef = useRef(null);
  const dayEvents = eventsOn(events, date);
  const rows = dayRows(tasks, repeats, date);
  const doneCount = rows.filter((r) => r.done).length;
  const selectedHour = Math.floor(start / 60);
  const isToday = date === todayIso;

  // Open scrolled to the morning (or the current hour today) instead of midnight.
  useEffect(() => {
    const hour = isToday ? Math.max(0, new Date().getHours() - 1) : 7;
    const row = gridRef.current?.querySelector(`[data-hour="${hour}"]`);
    if (row && gridRef.current) gridRef.current.scrollTop = row.offsetTop;
  }, [date, isToday]);

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    eventActions.add({ date, start, length, title });
    setTitle("");
  }

  const minutes = scheduledMinutes(dayEvents);

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
          <div className="day-page-title">
            <span className="kicker">{isToday ? "Today · day view" : "Day view"}</span>
            <h1>{formatDayHeading(date)}</h1>
          </div>
          <button className="square-button" onClick={() => onDate(addDays(date, 1))} aria-label="Next day">
            <Icon name="next" />
          </button>
        </div>
        <span className="mono muted">
          {dayEvents.length} {dayEvents.length === 1 ? "block" : "blocks"} · {minutes ? formatLength(minutes) : "0h"}{" "}
          scheduled
        </span>
      </header>

      <div className="day-page-body">
        <section className="hour-grid panel" aria-label="Hourly schedule" ref={gridRef}>
          {HOURS.map((h) => {
            const inHour = eventsInHour(dayEvents, h);
            const selected = h === selectedHour;
            return (
              <div key={h} className={`hour-row${selected ? " selected" : ""}`} data-hour={h}>
                <button
                  className="hour-label mono"
                  onClick={() => setStart(h * 60)}
                  aria-label={`Schedule at ${formatTime(h * 60)}`}
                >
                  {formatTime(h * 60)}
                </button>
                <div className="hour-slot">
                  {inHour.map((ev) => (
                    <div
                      key={ev.id}
                      className="event-chip"
                      style={{ minHeight: `${Math.max(2.5, (ev.length / 60) * 2.75)}rem` }}
                    >
                      <div className="event-text">
                        <span className="event-title">{ev.title}</span>
                        <span className="event-time mono">
                          {formatTime(ev.start)} – {formatTime(ev.start + ev.length)} · {formatLength(ev.length)}
                        </span>
                      </div>
                      <button
                        className="square-button small"
                        onClick={() => eventActions.remove(ev.id)}
                        aria-label={`Remove ${ev.title}`}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                  {inHour.length === 0 && (
                    <button className="empty-slot" onClick={() => setStart(h * 60)} tabIndex={-1} aria-hidden="true">
                      {selected ? `+ new block at ${formatTime(start)}` : ""}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <div className="day-page-side">
          <form className="panel glow-panel schedule-form" onSubmit={submit}>
            <h2 className="kicker accent">Schedule block</h2>
            <label className="form-field">
              <span>What</span>
              <input
                className="text-input"
                type="text"
                placeholder="e.g. Gym — push day"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <div className="stepper-row">
              <div className="form-field">
                <span id="start-label">Start</span>
                <div className="stepper" role="group" aria-labelledby="start-label">
                  <button type="button" onClick={() => setStart((s) => Math.max(0, s - 30))} aria-label="Earlier">
                    −
                  </button>
                  <output className="mono">{formatTime(start)}</output>
                  <button
                    type="button"
                    onClick={() => setStart((s) => Math.min(DAY_MINUTES - 30, s + 30))}
                    aria-label="Later"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="form-field">
                <span id="length-label">Length</span>
                <div className="stepper" role="group" aria-labelledby="length-label">
                  <button type="button" onClick={() => setLength((l) => Math.max(15, l - 15))} aria-label="Shorter">
                    −
                  </button>
                  <output className="mono">{formatLength(length)}</output>
                  <button type="button" onClick={() => setLength((l) => Math.min(480, l + 15))} aria-label="Longer">
                    +
                  </button>
                </div>
              </div>
            </div>
            <span className="mono muted small-text">
              {formatTime(start)} → {formatTime(start + length)}
            </span>
            <button className="accent-button" type="submit" disabled={!title.trim()}>
              Add to schedule
            </button>
            <span className="muted small-text">Tip: tap any hour to set the start time.</span>
          </form>

          <section className="panel day-tasks" aria-label="Tasks">
            <h2 className="kicker">
              Tasks · {doneCount}/{rows.length}
            </h2>
            {rows.length ? (
              <DayTaskList rows={rows} date={date} taskActions={taskActions} repeatActions={repeatActions} />
            ) : (
              <p className="muted">No tasks for this day.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
