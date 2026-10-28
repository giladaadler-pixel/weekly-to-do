import { describe, it, expect } from "vitest";
import {
  STARTER_PLANS,
  plansOf,
  makePlan,
  updatePlan,
  deletePlan,
  findPlanByName,
  toggleExercise,
  movePlanExercise,
} from "./plans.js";
import { gymOf } from "./gym.js";

describe("plans", () => {
  it("has the six quick-start names", () => {
    expect(STARTER_PLANS).toEqual(["Push day", "Pull day", "Leg day", "Upper day", "Lower day", "Full body day"]);
  });

  it("makes a plan with a tidy name and unique exercises, or null when blank", () => {
    expect(makePlan("  Push   day ", ["Bench press", "bench press", " Dips "])).toMatchObject({
      name: "Push day",
      exercises: ["Bench press", "Dips"],
    });
    expect(makePlan("   ")).toBeNull();
    expect(makePlan("Empty").exercises).toEqual([]);
  });

  it("updates, deletes and finds plans", () => {
    const plans = [
      { id: "a", name: "Push day", exercises: ["Bench press"] },
      { id: "b", name: "Leg day", exercises: [] },
    ];
    expect(updatePlan(plans, "b", { name: "Legs", exercises: ["Squat", "SQUAT"] })[1]).toEqual({
      id: "b",
      name: "Legs",
      exercises: ["Squat"],
    });
    expect(updatePlan(plans, "a", { name: " ", exercises: [] })[0].name).toBe("Push day");
    expect(deletePlan(plans, "a").map((p) => p.id)).toEqual(["b"]);
    expect(findPlanByName(plans, "  push DAY ")?.id).toBe("a");
    expect(findPlanByName(plans, "Pull day")).toBeUndefined();
  });

  it("toggles and reorders exercises", () => {
    expect(toggleExercise(["Squat"], "Deadlift")).toEqual(["Squat", "Deadlift"]);
    expect(toggleExercise(["Squat", "Deadlift"], "squat")).toEqual(["Deadlift"]);
    expect(movePlanExercise(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(movePlanExercise(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(movePlanExercise(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });

  it("loads old data without plans, and drops broken ones", () => {
    expect(gymOf({ gym: { logs: [], lifts: [] } }).plans).toEqual([]);
    expect(plansOf({ plans: "nope" })).toEqual([]);
    expect(
      plansOf({
        plans: [
          { id: "a", name: "Push day", exercises: ["Bench press", 3, "bench press"] },
          { id: "b", name: "  " },
          { name: "No id" },
          null,
          { id: "c", name: "Legs", exercises: "Squat" },
        ],
      }),
    ).toEqual([
      { id: "a", name: "Push day", exercises: ["Bench press"] },
      { id: "c", name: "Legs", exercises: [] },
    ]);
  });
});
