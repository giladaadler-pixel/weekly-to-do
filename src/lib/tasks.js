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
