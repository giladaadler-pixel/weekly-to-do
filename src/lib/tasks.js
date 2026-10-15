export function makeTask(text, date, priority = "medium") {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return { id: crypto.randomUUID(), text: trimmed, date, done: false, priority };
}

export function updateTask(tasks, id, changes) {
  return tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
}

export function deleteTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

// Blank new text keeps the old text.
export function editText(tasks, id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return tasks;
  return updateTask(tasks, id, { text: trimmed });
}

export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Unfinished tasks first, sorted high → medium → low; done tasks last.
// Otherwise keeps the original order.
export function sortTasks(tasks) {
  return [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (a.done ? 0 : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  );
}
