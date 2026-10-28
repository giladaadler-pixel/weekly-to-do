// Workout plans on the Gym page. Saved in state.gym.plans as
// [{ id, name, exercises: [string] }], in display order. A plan is just a name and an
// ordered list of exercise names; exercises are unique, ignoring case.

// The Plans section allows adding up to this many. Only adding is capped: anyone who
// already has more keeps them all.
export const MAX_PLANS = 4;

export const STARTER_PLANS = ["Push day", "Pull day", "Leg day", "Upper day", "Lower day", "Full body day"];

// Built-in exercise suggestions for each starter plan name. They use the app's own lift
// names where one exists (Bench press, Squat…) so sets and PRs stay together. They aren't
// on your exercise list until you put one in a plan or log a set with it.
const PUSH = [
  "Bench press",
  "Incline dumbbell press",
  "Chest fly",
  "Overhead press",
  "Lateral raises",
  "Front raises",
  "Triceps pushdowns",
  "Overhead triceps extensions",
];
const PULL = [
  "Pull-up",
  "Lat pulldowns",
  "Seated cable rows",
  "Barbell rows",
  "Face pulls",
  "Dumbbell bicep curls",
  "Hammer curls",
  "Preacher curls",
];
const LEGS = [
  "Squat",
  "Leg press",
  "Romanian deadlifts",
  "Leg extensions",
  "Leg curls",
  "Walking lunges",
  "Standing calf raises",
  "Hip thrusts",
];
const FULL_BODY = [
  "Deadlift",
  "Squat",
  "Bench press",
  "Pull-up",
  "Overhead press",
  "Dumbbell lunges",
  "Bent-over rows",
  "Push-ups",
];

export const SUGGESTED_EXERCISES = {
  "Push day": PUSH,
  "Pull day": PULL,
  "Leg day": LEGS,
  "Upper day": [...PUSH, ...PULL],
  "Lower day": LEGS,
  "Full body day": FULL_BODY,
};

// The suggested exercises for a plan name (one of the starter names, ignoring case and
// extra spaces), or [] for any other name.
export function suggestionsFor(name) {
  const key = STARTER_PLANS.find((s) => same(s, tidy(name)));
  return key ? SUGGESTED_EXERCISES[key] : [];
}

function same(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function tidy(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ");
}

// Each name once, keeping the first spelling and order.
function unique(exercises) {
  const out = [];
  for (const e of exercises) {
    const name = tidy(e);
    if (name && !out.some((o) => same(o, name))) out.push(name);
  }
  return out;
}

// Saved plans, with anything broken dropped (missing id or name, exercises not strings).
export function plansOf(gym) {
  if (!Array.isArray(gym?.plans)) return [];
  return gym.plans
    .filter((p) => p && typeof p.id === "string" && typeof p.name === "string" && tidy(p.name))
    .map((p) => ({
      id: p.id,
      name: tidy(p.name),
      exercises: unique(Array.isArray(p.exercises) ? p.exercises.filter((e) => typeof e === "string") : []),
    }));
}

// A new plan, or null when the name is blank.
export function makePlan(name, exercises = []) {
  const clean = tidy(name);
  if (!clean) return null;
  return { id: crypto.randomUUID(), name: clean, exercises: unique(exercises) };
}

// plans with this plan's name and exercises changed (a blank name keeps the old one).
export function updatePlan(plans, id, { name, exercises }) {
  return plans.map((p) =>
    p.id === id
      ? { ...p, name: tidy(name) || p.name, exercises: exercises ? unique(exercises) : p.exercises }
      : p,
  );
}

export function deletePlan(plans, id) {
  return plans.filter((p) => p.id !== id);
}

// The plan with this name, ignoring case and extra spaces, or undefined.
export function findPlanByName(plans, name) {
  const clean = tidy(name);
  return plans.find((p) => same(p.name, clean));
}

// Adds the exercise to the end, or takes it out if it's there (ignoring case).
export function toggleExercise(exercises, name) {
  const clean = tidy(name);
  if (!clean) return exercises;
  return exercises.some((e) => same(e, clean)) ? exercises.filter((e) => !same(e, clean)) : [...exercises, clean];
}

// Exercises in after that weren't in before (ignoring case): the ones a save adds.
export function addedExercises(before, after) {
  return after.filter((e) => !before.some((b) => same(b, e)));
}

// Moves the exercise at index one place up (-1) or down (+1); out of range does nothing.
export function movePlanExercise(exercises, index, dir) {
  const to = index + dir;
  if (index < 0 || index >= exercises.length || to < 0 || to >= exercises.length) return exercises;
  const next = [...exercises];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
