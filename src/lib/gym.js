// The Gym page. Saved as state.gym = { logs, lifts }.
// A log is one set: { id, date "YYYY-MM-DD", lift, weight (lbs), reps }.
// A lift goal is { id, lift, target (lbs), due ("" or "YYYY-MM-DD") }.

export const LIFTS = ["Bench press", "Squat", "Deadlift", "Overhead press", "Pull-up"];

export const DEFAULT_GYM = { logs: [], lifts: [] };

// Saved data from before the Gym page has no gym key, or a partial one.
export function gymOf(state) {
  const gym = state.gym ?? {};
  return {
    logs: Array.isArray(gym.logs) ? gym.logs : [],
    lifts: Array.isArray(gym.lifts) ? gym.lifts : [],
  };
}

// A new set, or null unless weight and reps are positive numbers.
export function makeLog({ date, lift, weight, reps }) {
  const w = Number(weight);
  const r = Math.round(Number(reps));
  if (!lift || !(w > 0) || !(r > 0)) return null;
  return { id: crypto.randomUUID(), date, lift, weight: w, reps: r };
}

// A new lift goal, or null unless the target is a positive number.
export function makeLiftGoal({ lift, target, due = "" }) {
  const t = Number(target);
  if (!lift || !(t > 0)) return null;
  return { id: crypto.randomUUID(), lift, target: t, due };
}

// Heaviest weight logged for a lift, or 0.
export function bestWeight(logs, lift) {
  return logs.filter((l) => l.lift === lift).reduce((best, l) => Math.max(best, l.weight), 0);
}

// 0–100: how close the best set is to the goal's target.
export function goalProgress(logs, goal) {
  return Math.min(100, Math.round((bestWeight(logs, goal.lift) / goal.target) * 100));
}

// Ids of the sets that beat every earlier set of the same lift (personal records).
export function recordIds(logs) {
  const best = {};
  const ids = new Set();
  for (const log of logs) {
    if (!(best[log.lift] >= log.weight)) {
      ids.add(log.id);
      best[log.lift] = log.weight;
    }
  }
  return ids;
}

// Whether any set was logged on this date.
export function trainedOn(logs, date) {
  return logs.some((l) => l.date === date);
}
