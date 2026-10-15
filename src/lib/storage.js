// Saves the whole app state in localStorage. Never throws: if storage is
// blocked or full, the app keeps working without saving.

export const STORAGE_KEY = "weekly-to-do:v1";

export const DEFAULT_STATE = { tasks: [], repeats: [], goals: [], theme: "light" };

export function loadState(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") return { ...DEFAULT_STATE, ...saved };
  } catch {
    // Broken or blocked storage: start empty.
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: keep going without saving.
  }
}
