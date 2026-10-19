// Saves the whole app state in localStorage. Never throws: if storage is
// blocked or full, the app keeps working without saving.

export const STORAGE_KEY = "weekly-to-do:v1";

export const DEFAULT_STATE = {
  tasks: [],
  repeats: [],
  goals: [],
  theme: "light",
  ui: { sidebarPinned: false },
  // { id, goalId (null for general notes), text, date "YYYY-MM-DD" }
  notes: [],
  settings: { reminderTime: "08:00" },
};

// Saved data from an older version may be missing newer keys: fill them from the defaults.
// Also used when importing a backup.
export function withDefaults(saved) {
  return { ...DEFAULT_STATE, ...saved };
}

// storage defaults to window.localStorage, read inside the try: some browsers
// throw just for touching it when site data is blocked.
export function loadState(storage) {
  try {
    storage ??= window.localStorage;
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") return withDefaults(saved);
  } catch {
    // Broken or blocked storage: start empty.
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state, storage) {
  try {
    storage ??= window.localStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: keep going without saving.
  }
}
