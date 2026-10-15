import { describe, it, expect } from "vitest";
import { toISO, weekStart, weekDays, addDays, dayLabel } from "./dates.js";

describe("toISO", () => {
  it("uses local time, even just after midnight", () => {
    expect(toISO(new Date(2026, 9, 15, 0, 30))).toBe("2026-10-15");
  });
});

describe("weekStart", () => {
  it("returns the Sunday of the week", () => {
    expect(weekStart("2026-10-15")).toBe("2026-10-11");
    expect(weekStart("2026-10-11")).toBe("2026-10-11");
    expect(weekStart("2026-10-17")).toBe("2026-10-11");
  });
});

describe("weekDays", () => {
  it("returns the 7 days from Sunday to Saturday", () => {
    expect(weekDays("2026-10-11")).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
  });
});

describe("addDays", () => {
  it("crosses month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });

  it("does not drift across daylight-saving changes", () => {
    expect(addDays("2026-03-26", 2)).toBe("2026-03-28");
    expect(addDays("2026-10-24", 7)).toBe("2026-10-31");
  });
});

describe("dayLabel", () => {
  it("returns the short day name", () => {
    expect(dayLabel("2026-10-15")).toBe("Thu");
  });
});
