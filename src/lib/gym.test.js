import { describe, it, expect } from "vitest";
import { gymOf, makeLog, makeLiftGoal, lastWeight, setsToday, bestWeight, goalProgress, recordIds, trainedOn, liftOptions, canonicalLift, rememberLift, LIFTS } from "./gym.js";
import { parseBackup, exportBackup } from "./backup.js";

const log = (id, lift, weight, date = "2026-10-27") => ({ id, date, lift, weight, reps: 5 });

describe("gym", () => {
  it("fills in a missing or partial gym key", () => {
    expect(gymOf({})).toEqual({ logs: [], lifts: [], customLifts: [], plans: [] });
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

  it("tidies a typed lift name and reuses the spelling of one it matches", () => {
    const gym = { logs: [log("a", "Incline DB press", 60)], lifts: [], customLifts: ["Hip thrust"] };
    expect(canonicalLift("  bench   PRESS ", gym)).toBe("Bench press");
    expect(canonicalLift("hip thrust", gym)).toBe("Hip thrust");
    expect(canonicalLift("incline db press", gym)).toBe("Incline DB press");
    expect(canonicalLift("  Face   pull ", gym)).toBe("Face pull");
    expect(canonicalLift("   ", gym)).toBe("");
  });

  it("remembers only new custom lifts, after the built-in ones", () => {
    expect(rememberLift([], "Squat")).toEqual([]);
    expect(rememberLift(["Hip thrust"], "hip thrust")).toEqual(["Hip thrust"]);
    expect(rememberLift(["Hip thrust"], "Face pull")).toEqual(["Hip thrust", "Face pull"]);
    expect(liftOptions({ customLifts: ["Face pull"] })).toEqual([...LIFTS, "Face pull"]);
  });

  it("keeps custom lifts through a backup, and imports older backups without them", () => {
    const state = { tasks: [], gym: { logs: [], lifts: [], customLifts: ["Face pull"] } };
    expect(gymOf(parseBackup(exportBackup(state))).customLifts).toEqual(["Face pull"]);
    const old = parseBackup(JSON.stringify({ tasks: [], gym: { logs: [log("a", "Squat", 100)], lifts: [] } }));
    expect(gymOf(old)).toMatchObject({ customLifts: [], logs: [{ lift: "Squat" }] });
  });

  it("knows the last weight and today's sets for a lift", () => {
    const logs = [log("a", "Squat", 200, "2026-10-27"), log("b", "Squat", 185), log("c", "Squat", 190, "2026-10-28")];
    expect(lastWeight(logs, "Squat")).toBe(190);
    expect(lastWeight(logs, "Deadlift")).toBe(null);
    expect(setsToday(logs, "Squat", "2026-10-27")).toBe(2);
    expect(setsToday(logs, "Squat", "2026-10-29")).toBe(0);
  });
});
