import { describe, it, expect } from "vitest";
import {
  makeRepeat,
  occursOn,
  toggleDoneOn,
  missedDates,
  makeUpOne,
  clearAll,
  deleteOne,
  deleteFuture,
  activeRepeats,
} from "./repeats.js";

// Tue and Thu, starting Sunday Oct 11.
const r = makeRepeat({ text: "Gym", days: [2, 4], startDate: "2026-10-11" });

describe("makeRepeat", () => {
  it("returns null when no days are picked", () => {
    expect(makeRepeat({ text: "Gym", days: [], startDate: "2026-10-11" })).toBeNull();
  });

  it("returns null when text is blank", () => {
    expect(makeRepeat({ text: "  ", days: [2], startDate: "2026-10-11" })).toBeNull();
  });

  it("fills in defaults", () => {
    expect(r).toMatchObject({
      text: "Gym",
      days: [2, 4],
      priority: "medium",
      startDate: "2026-10-11",
      endDate: null,
      goalId: null,
      doneDates: [],
      skipDates: [],
      clearedThrough: null,
    });
  });
});

describe("occursOn", () => {
  it("is true only on chosen days, from the start date", () => {
    expect(occursOn(r, "2026-10-13")).toBe(true); // Tue
    expect(occursOn(r, "2026-10-14")).toBe(false); // Wed
    expect(occursOn(r, "2026-10-06")).toBe(false); // before start
  });

  it("skips days deleted with 'Just this day'", () => {
    expect(occursOn(deleteOne(r, "2026-10-13"), "2026-10-13")).toBe(false);
  });

  it("stops at 'This and all future days'", () => {
    expect(occursOn(deleteFuture(r, "2026-10-20"), "2026-10-20")).toBe(false);
    expect(occursOn(deleteFuture(r, "2026-10-20"), "2026-10-15")).toBe(true);
  });
});

describe("toggleDoneOn", () => {
  it("checks and unchecks one day", () => {
    const done = toggleDoneOn(r, "2026-10-13");
    expect(done.doneDates).toEqual(["2026-10-13"]);
    expect(toggleDoneOn(done, "2026-10-13").doneDates).toEqual([]);
  });
});

describe("missed counter", () => {
  const r2 = toggleDoneOn(r, "2026-10-13");

  it("lists missed days before today, oldest first", () => {
    expect(missedDates(r2, "2026-10-22")).toEqual(["2026-10-15", "2026-10-20"]); // today itself not missed
  });

  it("goes down by one per make-up", () => {
    expect(missedDates(makeUpOne(r2, "2026-10-22"), "2026-10-22")).toEqual(["2026-10-20"]);
  });

  it("resets with clear all", () => {
    expect(missedDates(clearAll(r2, "2026-10-22"), "2026-10-22")).toEqual([]);
  });
});

describe("activeRepeats", () => {
  const goals = [
    { id: "open", done: false },
    { id: "finished", done: true },
  ];
  const plain = { ...r, id: "plain" };
  const forOpen = { ...r, id: "forOpen", goalId: "open" };
  const forFinished = { ...r, id: "forFinished", goalId: "finished" };
  const forMissing = { ...r, id: "forMissing", goalId: "deleted" };

  it("keeps normal repeats and repeats of unfinished goals only", () => {
    expect(activeRepeats([plain, forOpen, forFinished, forMissing], goals).map((x) => x.id)).toEqual([
      "plain",
      "forOpen",
    ]);
  });
});
