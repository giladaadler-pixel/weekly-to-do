import { addDays, dayLabel, weekDays, weekStart } from "./dates.js";
import { todayItems } from "./today.js";

const MAX_DAYS = 365;

// "done": the day had at least one task and all were done.
// "empty": no tasks that day, or it's a Saturday (neither counts nor breaks a streak).
// "missed": something that day was left unfinished.
// Only the day's own tasks count; overdue ones from earlier days don't.
export function dayStatus(state, iso) {
  if (dayLabel(iso) === "Sat") return "empty";
  const items = todayItems(state, iso);
  if (items.length === 0) return "empty";
  return items.every((i) => i.done) ? "done" : "missed";
}

// Done days in a row, walking back from today. Empty days are skipped, and an
// unfinished today is skipped too (it can still be finished), so it never breaks the streak.
export function streak(state, todayIso) {
  let count = 0;
  for (let i = 0; i < MAX_DAYS; i += 1) {
    const status = dayStatus(state, addDays(todayIso, -i));
    if (status === "done") count += 1;
    else if (status === "missed" && i > 0) break;
  }
  return count;
}

// Sun–Fri of this week. Days after today are "future"; so is today until it's done,
// since today is never "missed".
export function weekDots(state, todayIso) {
  return weekDays(weekStart(todayIso)).map((iso) => {
    if (iso > todayIso) return "future";
    const status = dayStatus(state, iso);
    if (iso === todayIso && status !== "done") return "future";
    return status;
  });
}
