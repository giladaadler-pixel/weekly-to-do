import { monthKey, endOfWeek, endOfMonth } from "./dates.js";
import { PRIORITY_ORDER } from "./tasks.js";

// choice: "none" | "week" | "month" | "date" (the "Done by" select).
export function resolveDueDate(choice, todayIso, pickedIso) {
  if (choice === "week") return endOfWeek(todayIso);
  if (choice === "month") return endOfMonth(todayIso);
  if (choice === "date") return pickedIso || null;
  return null;
}

function cleanItems(items) {
  return items.map((i) => ({ text: i.text.trim(), done: Boolean(i.done) })).filter((i) => i.text);
}

export function makeGoal(
  { title, style = "checklist", items = [], text = "", priority = "medium", dueDate = null },
  todayIso
) {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return null;
  return {
    id: crypto.randomUUID(),
    title: trimmed,
    month: monthKey(todayIso),
    done: false,
    priority,
    dueDate,
    style,
    items: cleanItems(items),
    text,
  };
}

// The month's goals: unfinished sorted high → low, then done ones.
export function goalsForMonth(goals, month) {
  return goals
    .filter((g) => g.month === month)
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (a.done ? 0 : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    );
}

// Checklist ↔ bullets keep items; to or from paragraph converts lines ↔ items.
export function convertStyle(goal, newStyle) {
  if (newStyle === goal.style) return goal;
  if (newStyle === "paragraph") {
    return { ...goal, style: newStyle, text: goal.items.map((i) => i.text).join("\n") };
  }
  if (goal.style === "paragraph") {
    const items = goal.text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: false }));
    return { ...goal, style: newStyle, items };
  }
  return { ...goal, style: newStyle };
}

export function updateGoal(goals, id, changes) {
  return goals.map((g) => (g.id === id ? { ...g, ...changes } : g));
}

export function deleteGoal(goals, id) {
  return goals.filter((g) => g.id !== id);
}
