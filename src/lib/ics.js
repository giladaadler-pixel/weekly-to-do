// The daily reminder as an iCalendar (.ics) file: one event that repeats every day at the
// chosen time, with an alert. The time is "floating" (no time zone), so it stays at that
// clock time wherever the phone is.

const SUMMARY = "Check your to-do list ✅";

// Text values escape backslashes, commas, semicolons and newlines.
export function escapeText(text) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 bytes continue on the next line after CRLF + a space.
// Splits between characters, never inside one (✅ is 3 bytes).
function fold(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const pad = (n) => String(n).padStart(2, "0");

function utcStamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function floating(dateIso, minutes) {
  return `${dateIso.replace(/-/g, "")}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}

// A workout plan as a calendar event: date "YYYY-MM-DD", start (minutes after midnight),
// length (minutes), weekly (repeat every week). Floating time like the reminder, with an
// alert 15 minutes before.
export function buildWorkoutIcs({ title, date, start, length, weekly = false, uid, now = new Date() }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Weekly To-Do//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${floating(date, start)}`,
    `DURATION:PT${length}M`,
    ...(weekly ? ["RRULE:FREQ=WEEKLY"] : []),
    `SUMMARY:${escapeText(title)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

// "Push day.ics": the plan name without characters file names can't have.
export function workoutFileName(name) {
  const safe = name.replace(/[/\\:*?"<>|]/g, "").trim();
  return `${safe || "workout"}.ics`;
}

// time: "HH:MM". todayIso: "YYYY-MM-DD", the first day. now: for DTSTAMP.
export function buildReminderIcs({ time, url, todayIso, uid, now = new Date() }) {
  const [hours, minutes] = time.split(":");
  const start = `${todayIso.replace(/-/g, "")}T${hours}${minutes}00`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Weekly To-Do//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${start}`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(SUMMARY)}`,
    `DESCRIPTION:${escapeText(`Open your list: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(SUMMARY)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
