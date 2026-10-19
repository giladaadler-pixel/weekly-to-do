// Export and import the whole saved state as a JSON file. On iPhone the home-screen app's
// storage is separate from Safari's, so this is how tasks move into it.
import { withDefaults } from "./storage.js";

export function exportBackup(state) {
  return JSON.stringify(state, null, 2);
}

// A full state, or null if the text isn't a Weekly To-Do backup
// (valid JSON for an object with a tasks array).
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.tasks)) return null;
  return withDefaults(data);
}

export function backupFileName(todayIso) {
  return `weekly-to-do-backup-${todayIso}.json`;
}
