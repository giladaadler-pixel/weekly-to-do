import { describe, it, expect } from "vitest";
import { gymOf, makeLog, makeLiftGoal, bestWeight, goalProgress, recordIds, trainedOn } from "./gym.js";

const log = (id, lift, weight, date = "2026-10-27") => ({ id, date, lift, weight, reps: 5 });

describe("gym", () => {
  it("fills in a missing or partial gym key", () => {
    expect(gymOf({})).toEqual({ logs: [], lifts: [] });
    expect(gymOf({ gym: { logs: [log("a", "Squat", 100)] } }).lifts).toEqual([]);
  });

  it("makes a set only with a positive weight and reps", () => {
    expect(makeLog({ date: "d", lift: "Bench press", weight: "165", reps: "5" })).toMatchObject({
      lift: "Bench press",
      weight: 165,
      reps: 5,
    });
    expect(makeLog({ date: "d", lift: "Bench press", weight: "", reps: "5" })).toBeNull();
    expect(makeLog({ date: "d", lift: "Bench press", weight: "100", reps: "0" })).toBeNull();
  });

  it("makes a lift goal only with a positive target", () => {
    expect(makeLiftGoal({ lift: "Bench press", target: "225" })).toMatchObject({ target: 225, due: "" });
    expect(makeLiftGoal({ lift: "Bench press", target: "x" })).toBeNull();
  });

  it("tracks the best set and progress toward a goal", () => {
    const logs = [log("a", "Bench press", 150), log("b", "Bench press", 170), log("c", "Squat", 300)];
    expect(bestWeight(logs, "Bench press")).toBe(170);
    expect(bestWeight(logs, "Deadlift")).toBe(0);
    expect(goalProgress(logs, { lift: "Bench press", target: 225 })).toBe(76);
    expect(goalProgress(logs, { lift: "Bench press", target: 160 })).toBe(100);
  });

  it("marks personal records in logging order", () => {
    const logs = [log("a", "Bench press", 150), log("b", "Bench press", 140), log("c", "Bench press", 155)];
    expect([...recordIds(logs)]).toEqual(["a", "c"]);
  });

  it("knows which days had training", () => {
    const logs = [log("a", "Squat", 100, "2026-10-26")];
    expect(trainedOn(logs, "2026-10-26")).toBe(true);
    expect(trainedOn(logs, "2026-10-27")).toBe(false);
  });
});
