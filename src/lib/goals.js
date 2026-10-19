import { monthKey, endOfWeek, endOfMonth } from "./dates.js";
import { PRIORITY_ORDER } from "./tasks.js";
import { makeRepeat } from "./repeats.js";

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

// Every unfinished goal, from any month, high → low. Done goals live on Accomplishments.
export function openGoals(goals) {
  return goals
    .filter((g) => !g.done)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// completedAt is a timestamp (ms) so goals done on the same day still sort right.
// Goals marked done before completedAt existed have none.
export function setGoalDone(goals, id, done, now = Date.now()) {
  return updateGoal(goals, id, { done, completedAt: done ? now : null });
}

// Every done goal, newest first. Ones with no completedAt go last.
export function accomplishments(goals) {
  return goals.filter((g) => g.done).sort((a, b) => (b.completedAt ?? -1) - (a.completedAt ?? -1));
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

// A goal's "Show on days": a repeat from today until the goal's deadline.
export function makeGoalRepeat(goal, days, todayIso) {
  return makeRepeat({
    text: goal.title,
    days,
    priority: goal.priority,
    startDate: todayIso,
    endDate: goal.dueDate,
    goalId: goal.id,
  });
}

// Deleting a goal also deletes its 🎯 repeats and its notes.
export function deleteGoalAndRepeats(state, goalId) {
  return {
    ...state,
    goals: deleteGoal(state.goals, goalId),
    repeats: state.repeats.filter((r) => r.goalId !== goalId),
    notes: (state.notes ?? []).filter((n) => n.goalId !== goalId),
  };
}
