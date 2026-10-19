import { describe, it, expect } from "vitest";
import { dayStatus, streak, weekDots } from "./streaks.js";
import { addDays, dayLabel } from "./dates.js";

// Week of Sun Oct 18 – Fri Oct 23, 2026. Today is Monday the 19th; Saturday is the 17th.
const TODAY = "2026-10-19";

let n = 0;
function task(date, done) {
  n += 1;
  return { id: `t${n}`, text: `Task ${n}`, date, done, priority: "medium" };
}

function repeat(fields) {
  return { id: "r", text: "Stretch", days: [0, 1, 2, 3, 4, 5], priority: "medium", startDate: "2026-10-01", endDate: null, goalId: null, doneDates: [], skipDates: [], clearedThrough: null, ...fields };
}

function state(fields) {
  return { tasks: [], repeats: [], goals: [], ...fields };
}

describe("dayStatus", () => {
  it("is done when every task that day is done", () => {
    expect(dayStatus(state({ tasks: [task("2026-10-16", true), task("2026-10-16", true)] }), "2026-10-16")).toBe("done");
  });

  it("is missed when any task that day is unfinished", () => {
    expect(dayStatus(state({ tasks: [task("2026-10-16", true), task("2026-10-16", false)] }), "2026-10-16")).toBe("missed");
  });

  it("is empty when the day had no tasks", () => {
    expect(dayStatus(state({ tasks: [task("2026-10-15", false)] }), "2026-10-16")).toBe("empty");
  });

  it("is empty on a Saturday, even with tasks", () => {
    expect(dayStatus(state({ tasks: [task("2026-10-17", false)] }), "2026-10-17")).toBe("empty");
  });

  it("counts repeat copies", () => {
    const r = repeat({ days: [5] }); // Fridays
    expect(dayStatus(state({ repeats: [r] }), "2026-10-16")).toBe("missed");
    expect(dayStatus(state({ repeats: [{ ...r, doneDates: ["2026-10-16"] }] }), "2026-10-16")).toBe("done");
  });

  it("counts goal repeat copies while the goal is open", () => {
    const r = repeat({ days: [5], goalId: "g1" });
    const s = state({ repeats: [r], goals: [{ id: "g1", done: false }] });
    expect(dayStatus(s, "2026-10-16")).toBe("missed");
  });

  it("only looks at that day's own tasks, not overdue ones from earlier", () => {
    const s = state({ tasks: [task("2026-10-16", false), task(TODAY, true)] });
    expect(dayStatus(s, TODAY)).toBe("done");
  });
});

describe("streak", () => {
  it("counts done days, skipping empty days and Saturdays", () => {
    const s = state({
      tasks: [
        task("2026-10-15", true), // Thu
        task("2026-10-16", true), // Fri
        task("2026-10-17", false), // Sat: skipped even though unfinished
        // Sun 18: no tasks, skipped
      ],
    });
    expect(streak(s, TODAY)).toBe(2);
  });

  it("counts today once it's done", () => {
    const s = state({ tasks: [task("2026-10-16", true), task(TODAY, true)] });
    expect(streak(s, TODAY)).toBe(2);
  });

  it("never lets an unfinished today break the streak", () => {
    const s = state({ tasks: [task("2026-10-16", true), task(TODAY, false)] });
    expect(streak(s, TODAY)).toBe(1);
  });

  it("stops at a missed day", () => {
    const s = state({
      tasks: [task("2026-10-14", true), task("2026-10-15", false), task("2026-10-16", true), task(TODAY, true)],
    });
    expect(streak(s, TODAY)).toBe(2);
  });

  it("is 0 with nothing done", () => {
    expect(streak(state({ tasks: [task("2026-10-16", false)] }), TODAY)).toBe(0);
  });

  it("counts repeat and goal repeat copies", () => {
    const daily = repeat({ id: "d", days: [4, 5], doneDates: ["2026-10-15", "2026-10-16"] });
    const goalDays = repeat({ id: "g", days: [5], goalId: "g1", doneDates: ["2026-10-16"] });
    const s = state({ repeats: [daily, goalDays], goals: [{ id: "g1", done: false }] });
    expect(streak(s, TODAY)).toBe(2);
  });

  it("stops after 365 days", () => {
    const start = addDays(TODAY, -800);
    const doneDates = [];
    for (let d = start; d <= TODAY; d = addDays(d, 1)) doneDates.push(d);
    const s = state({ repeats: [repeat({ startDate: start, doneDates })] });
    let expected = 0;
    for (let i = 0; i < 365; i += 1) if (dayLabel(addDays(TODAY, -i)) !== "Sat") expected += 1;
    expect(streak(s, TODAY)).toBe(expected);
  });
});

describe("weekDots", () => {
  it("gives Sun–Fri statuses, with later days as future", () => {
    const s = state({ tasks: [task("2026-10-18", true)] });
    expect(weekDots(s, TODAY)).toEqual(["done", "future", "future", "future", "future", "future"]);
  });

  it("shows today as done once finished", () => {
    const s = state({ tasks: [task("2026-10-18", false), task(TODAY, true)] });
    expect(weekDots(s, TODAY)).toEqual(["missed", "done", "future", "future", "future", "future"]);
  });

  it("shows an unfinished today as future, since today never counts as missed", () => {
    const s = state({ tasks: [task(TODAY, false)] });
    expect(weekDots(s, TODAY)[1]).toBe("future");
  });

  it("shows days with no tasks as empty", () => {
    expect(weekDots(state(), "2026-10-21")).toEqual(["empty", "empty", "empty", "future", "future", "future"]);
  });
});
