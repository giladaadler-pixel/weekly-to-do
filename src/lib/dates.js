// All dates are local "YYYY-MM-DD" strings. Never use toISOString() (it is UTC).

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISO(new Date());
}

// Day math uses setDate, not milliseconds, so daylight-saving changes don't drift.
export function addDays(iso, n) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + n);
  return toISO(date);
}

export function weekStart(iso) {
  return addDays(iso, -fromISO(iso).getDay());
}

export function weekDays(startIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
}

export function dayLabel(iso) {
  return DAY_LABELS[fromISO(iso).getDay()];
}
