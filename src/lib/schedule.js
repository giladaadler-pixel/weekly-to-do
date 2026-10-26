// The day page's hour-by-hour schedule. An event is
// { id, date "YYYY-MM-DD", start (minutes after midnight), length (minutes), title }.

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
export function makeEvent({ date, start, length, title }) {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return null;
  const s = Math.min(Math.max(0, Math.round(start)), DAY_MINUTES - 15);
  const len = Math.min(Math.max(15, Math.round(length)), DAY_MINUTES - s);
  return { id: crypto.randomUUID(), date, start: s, length: len, title: trimmed };
}

// One day's events, earliest first.
export function eventsOn(events, date) {
  return events.filter((e) => e.date === date).sort((a, b) => a.start - b.start);
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
