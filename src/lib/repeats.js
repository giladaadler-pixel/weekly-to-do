// Repeating tasks (and goal days). days are numbers: 0 = Sun … 6 = Sat.
import { addDays } from "./dates.js";

function weekday(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function makeRepeat({ text, days, priority = "medium", startDate, endDate = null, goalId = null }) {
  const trimmed = (text ?? "").trim();
  if (!trimmed || !days || days.length === 0) return null;
  return {
    id: crypto.randomUUID(),
    text: trimmed,
    days: [...days].sort(),
    priority,
    startDate,
    endDate,
    goalId,
    doneDates: [],
    skipDates: [],
    clearedThrough: null,
  };
}

export function occursOn(repeat, iso) {
  return (
    iso >= repeat.startDate &&
    (repeat.endDate === null || iso <= repeat.endDate) &&
    repeat.days.includes(weekday(iso)) &&
    !repeat.skipDates.includes(iso)
  );
}

export function isDoneOn(repeat, iso) {
  return repeat.doneDates.includes(iso);
}

export function toggleDoneOn(repeat, iso) {
  const doneDates = isDoneOn(repeat, iso)
    ? repeat.doneDates.filter((d) => d !== iso)
    : [...repeat.doneDates, iso];
  return { ...repeat, doneDates };
}

// Days before today (and after clearedThrough) that were not checked off. Oldest first.
export function missedDates(repeat, todayIso) {
  let day = repeat.startDate;
  if (repeat.clearedThrough && repeat.clearedThrough >= day) day = addDays(repeat.clearedThrough, 1);
  const missed = [];
  for (; day < todayIso; day = addDays(day, 1)) {
    if (repeat.endDate !== null && day > repeat.endDate) break;
    if (occursOn(repeat, day) && !isDoneOn(repeat, day)) missed.push(day);
  }
  return missed;
}

// Checking an Overdue repeat makes up the oldest missed day.
export function makeUpOne(repeat, todayIso) {
  const [oldest] = missedDates(repeat, todayIso);
  return oldest ? { ...repeat, doneDates: [...repeat.doneDates, oldest] } : repeat;
}

export function clearAll(repeat, todayIso) {
  return { ...repeat, clearedThrough: addDays(todayIso, -1) };
}

// "Just this day"
export function deleteOne(repeat, iso) {
  return { ...repeat, skipDates: [...repeat.skipDates, iso] };
}

// "This and all future days"
export function deleteFuture(repeat, iso) {
  return { ...repeat, endDate: addDays(iso, -1) };
}

// Drops goal-day repeats whose goal is done or no longer exists.
export function activeRepeats(repeats, goals) {
  return repeats.filter((r) => {
    if (r.goalId === null || r.goalId === undefined) return true;
    const goal = goals.find((g) => g.id === r.goalId);
    return Boolean(goal) && !goal.done;
  });
}
