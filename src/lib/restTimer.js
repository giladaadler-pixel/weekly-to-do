// Gym session + rest timer between sets.
// Kept under its own key, apart from the main saved data (weekly-to-do:v1), so a running
// timer never touches users' tasks.
//
// Shape: { active, startedAt, planId, setsLogged, duration, endsAt, remaining, doneAt }
//   active     — a gym session is going (the timer then shows on the Week page too)
//   planId     — the workout plan the session follows, or null for No plan
//   setsLogged — sets logged since the session started (sets only store a date)
//   duration   — rest length in seconds (default 90)
//   endsAt     — ms timestamp while counting down, else null
//   remaining  — seconds left while paused, else null
//   doneAt     — ms timestamp when the last rest finished, for the "Rest over" flash

export const SESSION_KEY = "weekly-to-do:gym-session";
export const DEFAULT_REST = 90;
export const MIN_REST = 10;
export const MAX_REST = 600;
export const REST_PRESETS = [60, 90, 120, 180];

export const IDLE_SESSION = {
  active: false,
  startedAt: null,
  planId: null,
  setsLogged: 0,
  duration: DEFAULT_REST,
  endsAt: null,
  remaining: null,
  doneAt: null,
};

function clampRest(secs) {
  const n = Math.round(Number(secs));
  if (!Number.isFinite(n)) return DEFAULT_REST;
  return Math.min(MAX_REST, Math.max(MIN_REST, n));
}

export function loadSession(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(SESSION_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return { ...IDLE_SESSION };
    return {
      ...IDLE_SESSION,
      ...saved,
      planId: typeof saved.planId === "string" ? saved.planId : null,
      setsLogged: Number.isInteger(saved.setsLogged) && saved.setsLogged > 0 ? saved.setsLogged : 0,
      duration: clampRest(saved.duration ?? DEFAULT_REST),
    };
  } catch {
    return { ...IDLE_SESSION };
  }
}

export function saveSession(session, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private mode or storage full: the timer still works for this visit.
  }
}

// Starts a session following a plan (or null for No plan). During a session it only
// switches the plan, keeping the start time, the set count and the timer.
export function startSession(s, now, planId = null) {
  if (s.active) return { ...s, planId };
  return { ...s, active: true, startedAt: now, planId, setsLogged: 0, endsAt: null, remaining: null, doneAt: null };
}

// One more set logged in this session (nothing to count outside a session).
export function countSet(s) {
  return s.active ? { ...s, setsLogged: s.setsLogged + 1 } : s;
}

// Ending the session stops the timer but keeps the chosen rest length.
export function endSession(s) {
  return { ...IDLE_SESSION, duration: s.duration };
}

export function isRunning(s) {
  return s.endsAt != null;
}

export function isPaused(s) {
  return s.endsAt == null && s.remaining != null;
}

// Whole seconds left to show on the clock.
export function secondsLeft(s, now) {
  if (s.endsAt != null) return Math.max(0, Math.ceil((s.endsAt - now) / 1000));
  if (s.remaining != null) return s.remaining;
  return s.duration;
}

// Start from the full rest, or carry on from a pause.
export function startTimer(s, now) {
  const secs = s.remaining ?? s.duration;
  return { ...s, endsAt: now + secs * 1000, remaining: null, doneAt: null };
}

export function pauseTimer(s, now) {
  if (s.endsAt == null) return s;
  return { ...s, endsAt: null, remaining: secondsLeft(s, now) };
}

export function resetTimer(s) {
  return { ...s, endsAt: null, remaining: null, doneAt: null };
}

// Called when the countdown reaches zero.
export function finishTimer(s, now) {
  return { ...s, endsAt: null, remaining: null, doneAt: now };
}

// Changing the length resets an idle or paused timer; a running one keeps going.
export function setDuration(s, secs) {
  const duration = clampRest(secs);
  return isRunning(s) ? { ...s, duration } : { ...s, duration, remaining: null, doneAt: null };
}

export function formatClock(secs) {
  const m = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");
  return `${m}:${ss}`;
}
