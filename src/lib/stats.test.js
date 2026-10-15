import { describe, it, expect } from "vitest";
import { weekStats } from "./stats.js";

const task = (id, date, done) => ({ id, text: id, date, done, priority: "medium" });
// Tue and Thu, checked off on Tue Oct 13 only.
const gym = {
  id: "gym",
  text: "Gym",
  days: [2, 4],
  priority: "medium",
  startDate: "2026-10-11",
  endDate: null,
  goalId: null,
  doneDates: ["2026-10-13"],
  skipDates: [],
  clearedThrough: null,
};

describe("weekStats", () => {
  it("counts tasks and repeat copies in the viewed week only", () => {
    const tasks = [task("a", "2026-10-12", true), task("b", "2026-10-16", false), task("c", "2026-10-18", true)];
    expect(weekStats({ tasks, repeats: [gym], goals: [] }, "2026-10-11")).toEqual({ done: 2, total: 4 });
  });

  it("ignores repeats of finished goals", () => {
    const goalGym = { ...gym, goalId: "g" };
    expect(weekStats({ tasks: [], repeats: [goalGym], goals: [{ id: "g", done: true }] }, "2026-10-11")).toEqual({
      done: 0,
      total: 0,
    });
  });
});
