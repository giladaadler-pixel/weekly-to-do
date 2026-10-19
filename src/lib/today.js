import { sortTasks } from "./tasks.js";
import { occursOn, isDoneOn, activeRepeats } from "./repeats.js";

// One day's rows: its one-off tasks plus that day's copy of each repeat, sorted together.
// A repeat copy is { id, text, priority, done, repeat }, with the repeat's own id.
// Shared by the day boxes and the Today page so they always agree.
export function dayRows(tasks, repeats, iso) {
  return sortTasks([
    ...tasks.filter((t) => t.date === iso),
    ...repeats
      .filter((r) => occursOn(r, iso))
      .map((r) => ({ id: r.id, text: r.text, priority: r.priority, done: isDoneOn(r, iso), repeat: r })),
  ]);
}

// Today's one-off tasks, 🔁 repeat copies and 🎯 copies of open goals.
export function todayItems(state, todayIso) {
  return dayRows(state.tasks, activeRepeats(state.repeats, state.goals), todayIso);
}

export function todayCounts(state, todayIso) {
  const items = todayItems(state, todayIso);
  return { done: items.filter((i) => i.done).length, total: items.length };
}
