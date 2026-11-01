// The day page's hour-by-hour schedule. An event is
// { id, date "YYYY-MM-DD", start (minutes after midnight), length (minutes), title,
//   repeat? "weekly", reminder? (minutes before the start to notify; 0 = at the start) }.
// A weekly event also shows on every later date on the same weekday.

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
// reminder: minutes before to notify (see REMINDER_OPTIONS); left out for no reminder.
export function makeEvent({ date, start, length, title, repeat, reminder }) {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return null;
  const s = Math.min(Math.max(0, Math.round(start)), DAY_MINUTES - 15);
  const len = Math.min(Math.max(15, Math.round(length)), DAY_MINUTES - s);
  let event = { id: crypto.randomUUID(), date, start: s, length: len, title: trimmed };
  if (repeat === "weekly") event = { ...event, repeat: "weekly" };
  return withReminder(event, reminder);
}

// The "Notify me" choices, like Google Calendar. null = no notification.
export const REMINDER_OPTIONS = [
  { value: null, label: "No notification" },
  { value: 0, label: "At start time" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
];

// A valid reminder in minutes, or null for none.
export function cleanReminder(reminder) {
  if (reminder === null || reminder === undefined || reminder === "") return null;
  const n = Math.round(Number(reminder));
  return Number.isFinite(n) && n >= 0 && n <= 7 * DAY_MINUTES ? n : null;
}

function withReminder(event, reminder) {
  const r = cleanReminder(reminder);
  const { reminder: _old, ...rest } = event;
  return r === null ? rest : { ...rest, reminder: r };
}

// Changes (or removes, with null) one event's reminder.
export function setReminder(events, id, reminder) {
  return events.map((e) => (e.id === id ? withReminder(e, reminder) : e));
}

// 10 → "10 minutes before", 60 → "1 hour before", 0 → "At start time".
export function formatReminder(reminder) {
  const r = cleanReminder(reminder);
  const preset = REMINDER_OPTIONS.find((o) => o.value === r);
  if (preset) return preset.label;
  if (r % DAY_MINUTES === 0) return `${r / DAY_MINUTES} days before`;
  if (r % 60 === 0) return `${r / 60} hours before`;
  return `${r} minutes before`;
}

function isoOf(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Notifications that should go off now. Looks at every day from (now − the longest reminder)
// up to the next week, so a "1 day before" reminder for tomorrow is found too.
// An alert is due from its alert time until the event starts, so one missed while the app
// was closed still shows when it opens (if the event hasn't started yet).
// fired: a Set of keys already shown. Returns [{ key, event, date, startsAt (Date), minutesLeft }].
export function dueReminders(events, now = new Date(), fired = new Set()) {
  const due = [];
  const withReminders = events.filter((e) => cleanReminder(e.reminder) !== null);
  if (!withReminders.length) return due;
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const date = isoOf(day);
    for (const event of withReminders) {
      if (!happensOn(event, date)) continue;
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, event.start);
      const alertAt = new Date(startsAt.getTime() - event.reminder * 60 * 1000);
      const key = `${event.id}@${date}`;
      // Due from the alert time; "at start time" alerts stay due for the first minute.
      const end = startsAt.getTime() + (event.reminder === 0 ? 60 * 1000 : 0);
      if (now >= alertAt && now.getTime() < end && !fired.has(key)) {
        const minutesLeft = Math.max(0, Math.round((startsAt - now) / 60000));
        due.push({ key, event, date, startsAt, minutesLeft });
      }
    }
  }
  return due;
}

// "Gym starts in 10 minutes · 6:00 PM", "Gym is starting now · 6:00 PM"
export function reminderMessage({ event, minutesLeft }) {
  const when = formatTime12(event.start);
  if (minutesLeft <= 0) return `${event.title} is starting now · ${when}`;
  let left;
  if (minutesLeft >= DAY_MINUTES - 30) left = "tomorrow";
  else if (minutesLeft >= 60) {
    const h = Math.round(minutesLeft / 60);
    left = `in ${h} ${h === 1 ? "hour" : "hours"}`;
  } else left = `in ${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"}`;
  return `${event.title} starts ${left} · ${when}`;
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
