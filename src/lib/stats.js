import { weekDays } from "./dates.js";
import { occursOn, isDoneOn, activeRepeats } from "./repeats.js";

// "X of Y done" for one week: tasks dated in the week plus each active repeat copy.
export function weekStats({ tasks, repeats, goals }, weekStartIso) {
  const days = weekDays(weekStartIso);
  let done = 0;
  let total = 0;
  for (const task of tasks) {
    if (!days.includes(task.date)) continue;
    total += 1;
    if (task.done) done += 1;
  }
  for (const repeat of activeRepeats(repeats, goals)) {
    for (const day of days) {
      if (!occursOn(repeat, day)) continue;
      total += 1;
      if (isDoneOn(repeat, day)) done += 1;
    }
  }
  return { done, total };
}
