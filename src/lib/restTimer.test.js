import { describe, it, expect } from "vitest";
import {
  IDLE_SESSION,
  SESSION_KEY,
  DEFAULT_REST,
  loadSession,
  saveSession,
  startSession,
  endSession,
  startTimer,
  pauseTimer,
  resetTimer,
  finishTimer,
  setDuration,
  secondsLeft,
  isRunning,
  isPaused,
  formatClock,
} from "./restTimer.js";
import { vibrationPattern, BEEPS } from "./restAlert.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v), data };
}

describe("rest timer", () => {
  it("defaults to 90 seconds and no session", () => {
    expect(DEFAULT_REST).toBe(90);
    const s = loadSession(memoryStorage());
    expect(s.active).toBe(false);
    expect(secondsLeft(s, 0)).toBe(90);
  });

  it("saves under its own key, never the main data key", () => {
    const storage = memoryStorage();
    saveSession(startSession(IDLE_SESSION, 5), storage);
    expect(Object.keys(storage.data)).toEqual([SESSION_KEY]);
    expect(SESSION_KEY).not.toBe("weekly-to-do:v1");
    expect(loadSession(storage).active).toBe(true);
  });

  it("survives broken saved data", () => {
    expect(loadSession(memoryStorage({ [SESSION_KEY]: "{oops" })).duration).toBe(90);
  });

  it("counts down, pauses and resumes", () => {
    let s = startTimer(IDLE_SESSION, 0);
    expect(isRunning(s)).toBe(true);
    expect(secondsLeft(s, 30_000)).toBe(60);
    s = pauseTimer(s, 30_000);
    expect(isPaused(s)).toBe(true);
    expect(secondsLeft(s, 999_999)).toBe(60);
    s = startTimer(s, 100_000);
    expect(secondsLeft(s, 110_000)).toBe(50);
    expect(secondsLeft(s, 500_000)).toBe(0);
  });

  it("finishes and resets back to the full rest", () => {
    let s = finishTimer(startTimer(IDLE_SESSION, 0), 90_000);
    expect(isRunning(s)).toBe(false);
    expect(s.doneAt).toBe(90_000);
    s = resetTimer(s);
    expect(s.doneAt).toBe(null);
    expect(secondsLeft(s, 0)).toBe(90);
  });

  it("lets you change the rest length within limits", () => {
    expect(setDuration(IDLE_SESSION, 120).duration).toBe(120);
    expect(setDuration(IDLE_SESSION, 2).duration).toBe(10);
    expect(setDuration(IDLE_SESSION, 9999).duration).toBe(600);
    const running = startTimer(IDLE_SESSION, 0);
    expect(setDuration(running, 60).endsAt).toBe(running.endsAt);
  });

  it("ending a session keeps the chosen rest length", () => {
    const s = endSession(startTimer(setDuration(startSession(IDLE_SESSION, 0), 120), 0));
    expect(s).toEqual({ ...IDLE_SESSION, duration: 120 });
  });

  it("formats the clock", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
  });

  it("buzzes the same number of times it beeps", () => {
    expect(BEEPS).toBeGreaterThanOrEqual(3);
    expect(BEEPS).toBeLessThanOrEqual(5);
    expect(vibrationPattern().filter((_, i) => i % 2 === 0)).toHaveLength(BEEPS);
  });
});
