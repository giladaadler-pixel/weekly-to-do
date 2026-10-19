import { describe, it, expect } from "vitest";
import { dayRows, todayItems, todayCounts } from "./today.js";

const TODAY = "2026-10-19"; // a Monday

function repeat(fields) {
  return { id: "r", text: "Stretch", days: [1], priority: "medium", startDate: "2026-10-01", endDate: null, goalId: null, doneDates: [], skipDates: [], clearedThrough: null, ...fields };
}

function state(fields) {
  return { tasks: [], repeats: [], goals: [], ...fields };
}

describe("todayItems", () => {
  it("includes only today's one-off tasks", () => {
    const s = state({
      tasks: [
        { id: "a", text: "Gym", date: TODAY, done: false, priority: "medium" },
        { id: "b", text: "Old", date: "2026-10-16", done: false, priority: "medium" },
      ],
    });
    expect(todayItems(s, TODAY).map((r) => r.id)).toEqual(["a"]);
  });

  it("includes today's repeat copy in the DayColumn row shape", () => {
    const r = repeat({ id: "r1", doneDates: [TODAY] });
    const [row] = todayItems(state({ repeats: [r] }), TODAY);
    expect(row).toEqual({ id: "r1", text: "Stretch", priority: "medium", done: true, repeat: r });
  });

  it("skips repeats that don't occur today", () => {
    expect(todayItems(state({ repeats: [repeat({ days: [2] })] }), TODAY)).toEqual([]);
  });

  it("includes goal repeats only while the goal is open", () => {
    const goalRepeat = repeat({ id: "gr", goalId: "g1" });
    const open = state({ repeats: [goalRepeat], goals: [{ id: "g1", done: false }] });
    const done = state({ repeats: [goalRepeat], goals: [{ id: "g1", done: true }] });
    expect(todayItems(open, TODAY).map((r) => r.id)).toEqual(["gr"]);
    expect(todayItems(done, TODAY)).toEqual([]);
  });

  it("sorts unfinished first by priority, done last", () => {
    const s = state({
      tasks: [
        { id: "low", text: "a", date: TODAY, done: false, priority: "low" },
        { id: "done", text: "b", date: TODAY, done: true, priority: "high" },
        { id: "high", text: "c", date: TODAY, done: false, priority: "high" },
      ],
    });
    expect(todayItems(s, TODAY).map((r) => r.id)).toEqual(["high", "low", "done"]);
  });
});

describe("todayCounts", () => {
  it("counts done and total across tasks and repeat copies", () => {
    const s = state({
      tasks: [
        { id: "a", text: "Gym", date: TODAY, done: true, priority: "medium" },
        { id: "b", text: "Mail", date: TODAY, done: false, priority: "medium" },
      ],
      repeats: [repeat({ doneDates: [TODAY] })],
    });
    expect(todayCounts(s, TODAY)).toEqual({ done: 2, total: 3 });
  });
});

describe("dayRows", () => {
  it("ignores tasks from other days even if passed in", () => {
    const rows = dayRows([{ id: "x", text: "x", date: "2026-10-20", done: false, priority: "low" }], [], TODAY);
    expect(rows).toEqual([]);
  });
});
