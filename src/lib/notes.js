// Dated notes. goalId is the goal a note belongs to, or null for general notes.

export function makeNote(text, goalId, todayIso) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  return { id: crypto.randomUUID(), goalId, text: trimmed, date: todayIso };
}

// Blank new text keeps the old text.
export function editNote(notes, id, text) {
  const trimmed = text.trim();
  if (!trimmed) return notes;
  return notes.map((n) => (n.id === id ? { ...n, text: trimmed } : n));
}

export function deleteNote(notes, id) {
  return notes.filter((n) => n.id !== id);
}

// A goal's notes (or general notes for null), newest first. Notes from the same day
// keep the order they were added, latest first.
export function notesFor(notes, goalId) {
  return notes
    .map((note, i) => ({ note, i }))
    .filter(({ note }) => (note.goalId ?? null) === goalId)
    .sort((a, b) => (a.note.date < b.note.date ? 1 : a.note.date > b.note.date ? -1 : b.i - a.i))
    .map(({ note }) => note);
}

export function countFor(notes, goalId) {
  return notes.filter((n) => (n.goalId ?? null) === goalId).length;
}
