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

// The week is Sunday to Friday. There is no Saturday.
export const WEEK_LENGTH = 6;

export function weekDays(startIso) {
  return Array.from({ length: WEEK_LENGTH }, (_, i) => addDays(startIso, i));
}

export function dayLabel(iso) {
  return DAY_LABELS[fromISO(iso).getDay()];
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Oct 11 – 16, 2026", "Nov 29 – Dec 4, 2026", "Dec 27, 2026 – Jan 1, 2027"
export function formatWeekRange(startIso) {
  const start = fromISO(startIso);
  const end = fromISO(addDays(startIso, WEEK_LENGTH - 1));
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

// The coming Friday (the day itself if it is a Friday; a Saturday rolls to the next one).
export function endOfWeek(iso) {
  return addDays(weekStart(addDays(iso, 1)), WEEK_LENGTH - 1);
}

export function endOfMonth(iso) {
  const date = fromISO(iso);
  return toISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

// "Oct 15, 2026"
export function formatLong(iso) {
  const date = fromISO(iso);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
