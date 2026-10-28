// The day page's hour-by-hour schedule. An event is
// { id, date "YYYY-MM-DD", start (minutes after midnight), length (minutes), title,
//   repeat? "weekly" }. A weekly event also shows on every later date on the same weekday.

export const DAY_MINUTES = 24 * 60;
export const HOURS = Array.from({ length: 24 }, (_, h) => h);

function pad(n) {
  return String(n).padStart(2, "0");
}

// 570 → "09:30"
export function formatTime(minutes) {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

// 90 → "1h 30m", 45 → "45m", 120 → "2h"
export function formatLength(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// A new event, or null when the title is blank. Start and length are kept inside the day.
// repeat: "weekly" for every week on that weekday; anything else is a one-off.
export function makeEvent({ date, start, length, title, repeat }) {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return null;
  const s = Math.min(Math.max(0, Math.round(start)), DAY_MINUTES - 15);
  const len = Math.min(Math.max(15, Math.round(length)), DAY_MINUTES - s);
  const event = { id: crypto.randomUUID(), date, start: s, length: len, title: trimmed };
  return repeat === "weekly" ? { ...event, repeat: "weekly" } : event;
}

function weekday(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

// Whether the event happens on this date: its own date, or (weekly) any later date on
// the same weekday. Any other repeat value counts as a one-off.
export function happensOn(event, date) {
  if (event.date === date) return true;
  return event.repeat === "weekly" && date > event.date && weekday(date) === weekday(event.date);
}

// One day's events, earliest first.
export function eventsOn(events, date) {
  return events.filter((e) => happensOn(e, date)).sort((a, b) => a.start - b.start);
}

// The events that start inside hour h (0–23).
export function eventsInHour(dayEvents, h) {
  return dayEvents.filter((e) => Math.floor(e.start / 60) === h);
}

export function deleteEvent(events, id) {
  return events.filter((e) => e.id !== id);
}

// Total scheduled minutes for a day's events.
export function scheduledMinutes(dayEvents) {
  return dayEvents.reduce((sum, e) => sum + e.length, 0);
}

// 0 → "12 AM", 9 → "9 AM", 12 → "12 PM", 23 → "11 PM". The day page's hour labels.
export function formatHour(h) {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12} ${suffix}`;
}

// 570 → "9:30 AM", 780 → "1:00 PM", 0 → "12:00 AM"
export function formatTime12(minutes) {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${pad(m % 60)} ${h < 12 ? "AM" : "PM"}`;
}

// Places a day's events side by side when they overlap, like a calendar app.
// Returns [{ event, col, cols }]: the event sits in column col of cols equal columns.
export function layoutEvents(dayEvents) {
  const sorted = [...dayEvents].sort((a, b) => a.start - b.start || b.length - a.length);
  const placed = [];
  let group = [];
  let groupEnd = -1;
  let colEnds = [];

  function closeGroup() {
    for (const p of group) p.cols = colEnds.length;
    placed.push(...group);
    group = [];
    colEnds = [];
  }

  for (const event of sorted) {
    if (event.start >= groupEnd) closeGroup();
    let col = colEnds.findIndex((end) => end <= event.start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = event.start + event.length;
    group.push({ event, col, cols: 1 });
    groupEnd = Math.max(groupEnd, event.start + event.length);
  }
  closeGroup();
  return placed;
}
