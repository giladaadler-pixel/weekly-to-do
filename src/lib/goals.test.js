import { describe, it, expect } from "vitest";
import { resolveDueDate, makeGoal, goalsForMonth, convertStyle, updateGoal, deleteGoal } from "./goals.js";

describe("resolveDueDate", () => {
  it("handles every 'Done by' choice", () => {
    expect(resolveDueDate("none", "2026-10-15")).toBeNull();
    expect(resolveDueDate("week", "2026-10-15")).toBe("2026-10-17");
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

describe("goalsForMonth", () => {
  it("returns the month's goals: unfinished by priority, then done", () => {
    const goals = [
      { id: "low", month: "2026-10", priority: "low", done: false },
      { id: "doneHigh", month: "2026-10", priority: "high", done: true },
      { id: "high", month: "2026-10", priority: "high", done: false },
      { id: "nov", month: "2026-11", priority: "high", done: false },
    ];
    expect(goalsForMonth(goals, "2026-10").map((g) => g.id)).toEqual(["high", "low", "doneHigh"]);
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
