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

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Oct 11 – 17, 2026", "Nov 29 – Dec 5, 2026", "Dec 27, 2026 – Jan 2, 2027"
export function formatWeekRange(startIso) {
  const start = fromISO(startIso);
  const end = fromISO(addDays(startIso, 6));
  const startMonth = MONTH_SHORT[start.getMonth()];
  const endMonth = MONTH_SHORT[end.getMonth()];
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }
  const endPart = startMonth === endMonth ? end.getDate() : `${endMonth} ${end.getDate()}`;
  return `${startMonth} ${start.getDate()} – ${endPart}, ${end.getFullYear()}`;
}

// "Oct 5"
export function formatShort(iso) {
  const date = fromISO(iso);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// "YYYY-MM"
export function monthKey(iso) {
  return iso.slice(0, 7);
}

// The coming Saturday (the day itself if it is a Saturday).
export function endOfWeek(iso) {
  return addDays(weekStart(iso), 6);
}

export function endOfMonth(iso) {
  const date = fromISO(iso);
  return toISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// month is "YYYY-MM"
export function addMonths(month, n) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + n, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthHeader(month) {
  return `${MONTH_LONG[Number(month.slice(5)) - 1]} Goals:`;
}
