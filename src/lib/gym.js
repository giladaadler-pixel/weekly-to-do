import { plansOf } from "./plans.js";

// The Gym page. Saved as state.gym = { logs, lifts, customLifts, plans }.
// A log is one set: { id, date "YYYY-MM-DD", lift, weight (lbs), reps }.
// A lift goal is { id, lift, target (lbs), due ("" or "YYYY-MM-DD") }.
// customLifts: exercise names typed in under "Other…", offered in the Lift dropdowns.
// Removing one from that list leaves its sets, goals and plans alone.
// plans: workout plans (see lib/plans.js).

export const LIFTS = ["Bench press", "Squat", "Deadlift", "Overhead press", "Pull-up"];

export const DEFAULT_GYM = { logs: [], lifts: [], customLifts: [], plans: [] };

// Saved data from before the Gym page has no gym key, or a partial one.
export function gymOf(state) {
  const gym = state.gym ?? {};
  return {
    logs: Array.isArray(gym.logs) ? gym.logs : [],
    lifts: Array.isArray(gym.lifts) ? gym.lifts : [],
    customLifts: Array.isArray(gym.customLifts) ? gym.customLifts.filter((l) => typeof l === "string" && l.trim()) : [],
    plans: plansOf(gym),
  };
}

// Built-in lifts, then the user's own: the Lift dropdown options.
export function liftOptions(gym) {
  return [...LIFTS, ...gym.customLifts];
}

// A typed exercise name, tidied: spaces trimmed, and the spelling of a lift already known
// (built-in, saved, or used by a set or goal) if it matches ignoring case. "" if blank.
export function canonicalLift(name, gym) {
  const clean = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const known = [...liftOptions(gym), ...gym.logs.map((l) => l.lift), ...gym.lifts.map((g) => g.lift)];
  return known.find((l) => l.toLowerCase() === clean.toLowerCase()) ?? clean;
}

// customLifts with this lift added, unless it's built-in or already there.
export function rememberLift(customLifts, lift) {
  const known = [...LIFTS, ...customLifts].map((l) => l.toLowerCase());
  return known.includes(lift.toLowerCase()) ? customLifts : [...customLifts, lift];
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
