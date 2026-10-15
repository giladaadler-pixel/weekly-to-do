import { describe, it, expect } from "vitest";
import { resolveDueDate, makeGoal, openGoals, setGoalDone, accomplishments, convertStyle, updateGoal, deleteGoal, deleteGoalAndRepeats, makeGoalRepeat } from "./goals.js";

describe("resolveDueDate", () => {
  it("handles every 'Done by' choice", () => {
    expect(resolveDueDate("none", "2026-10-15")).toBeNull();
    expect(resolveDueDate("week", "2026-10-15")).toBe("2026-10-16");
    expect(resolveDueDate("month", "2026-10-15")).toBe("2026-10-31");
    expect(resolveDueDate("date", "2026-10-15", "2026-11-03")).toBe("2026-11-03");
  });

  it("returns null when 'Pick a date' has no date", () => {
    expect(resolveDueDate("date", "2026-10-15", "")).toBeNull();
  });
});

describe("makeGoal", () => {
  it("ignores a blank title", () => {
    expect(makeGoal({ title: "  " }, "2026-10-15")).toBeNull();
  });

  it("belongs to the month it was created in", () => {
    const goal = makeGoal({ title: " Run 50 km ", style: "paragraph", text: "x" }, "2026-10-15");
    expect(goal).toMatchObject({
      title: "Run 50 km",
      month: "2026-10",
      done: false,
      priority: "medium",
      dueDate: null,
      style: "paragraph",
      text: "x",
    });
  });

  it("drops blank checklist items", () => {
    const goal = makeGoal(
      { title: "Read", style: "checklist", items: [{ text: "a", done: false }, { text: " ", done: false }] },
      "2026-10-15"
    );
    expect(goal.items).toEqual([{ text: "a", done: false }]);
  });
});

describe("convertStyle", () => {
  const checklistGoal = {
    id: "g",
    style: "checklist",
    items: [
      { text: "a", done: true },
      { text: "b", done: false },
    ],
    text: "",
  };
  const paragraphGoal = { id: "p", style: "paragraph", items: [], text: "a\n\nb" };

  it("keeps items between checklist and bullets", () => {
    expect(convertStyle(checklistGoal, "bullets").items).toEqual(checklistGoal.items);
  });

  it("turns items into lines for paragraph", () => {
    expect(convertStyle(checklistGoal, "paragraph").text).toBe("a\nb");
  });

  it("turns non-empty lines into items", () => {
    expect(convertStyle(paragraphGoal, "checklist").items).toEqual([
      { text: "a", done: false },
      { text: "b", done: false },
    ]);
  });
});

describe("openGoals", () => {
  it("returns unfinished goals from every month by priority, leaving out done ones", () => {
    const goals = [
      { id: "low", month: "2026-10", priority: "low", done: false },
      { id: "doneHigh", month: "2026-10", priority: "high", done: true },
      { id: "high", month: "2026-10", priority: "high", done: false },
      { id: "nov", month: "2026-11", priority: "high", done: false },
    ];
    expect(openGoals(goals).map((g) => g.id)).toEqual(["high", "nov", "low"]);
  });
});

describe("setGoalDone", () => {
  const g = { id: "g", title: "Run", done: false };

  it("saves when the goal was done", () => {
    expect(setGoalDone([g], "g", true, 1000)).toEqual([{ ...g, done: true, completedAt: 1000 }]);
  });

  it("clears the completion time when marked not done", () => {
    const done = { ...g, done: true, completedAt: 1000 };
    expect(setGoalDone([done], "g", false, 2000)).toEqual([{ ...g, done: false, completedAt: null }]);
  });
});

describe("accomplishments", () => {
  it("returns done goals newest first, ones without a date last", () => {
    const goals = [
      { id: "old", done: true, completedAt: 100 },
      { id: "open", done: false },
      { id: "undated", done: true },
      { id: "new", done: true, completedAt: 300 },
      { id: "mid", done: true, completedAt: 200 },
    ];
    expect(accomplishments(goals).map((g) => g.id)).toEqual(["new", "mid", "old", "undated"]);
  });
});

describe("updateGoal / deleteGoal", () => {
  const g = { id: "g", title: "Run", done: false };

  it("updates one goal", () => {
    expect(updateGoal([g], "g", { done: true })).toEqual([{ ...g, done: true }]);
  });

  it("deletes one goal", () => {
    expect(deleteGoal([g], "g")).toEqual([]);
  });
});

describe("deleteGoalAndRepeats", () => {
  it("removes the goal and every repeat for it", () => {
    const state = {
      tasks: [],
      theme: "light",
      goals: [{ id: "g1" }, { id: "g2" }],
      repeats: [
        { id: "r1", goalId: "g1" },
        { id: "r2", goalId: "g2" },
        { id: "r3", goalId: null },
        { id: "r4", goalId: "g1" },
      ],
    };
    const next = deleteGoalAndRepeats(state, "g1");
    expect(next.goals.map((g) => g.id)).toEqual(["g2"]);
    expect(next.repeats.map((x) => x.id)).toEqual(["r2", "r3"]);
  });
});

describe("makeGoalRepeat", () => {
  it("shows the goal on its days until its deadline", () => {
    const goal = makeGoal({ title: "Run", priority: "high", dueDate: "2026-10-31" }, "2026-10-15");
    expect(makeGoalRepeat(goal, [2], "2026-10-15")).toMatchObject({
      text: "Run",
      days: [2],
      priority: "high",
      startDate: "2026-10-15",
      endDate: "2026-10-31",
      goalId: goal.id,
    });
  });

  it("returns null when no days are picked", () => {
    const goal = makeGoal({ title: "Run" }, "2026-10-15");
    expect(makeGoalRepeat(goal, [], "2026-10-15")).toBeNull();
  });
});
