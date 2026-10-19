import { describe, it, expect } from "vitest";
import { toISO, weekStart, weekDays, addDays, dayLabel, formatWeekRange, monthKey, endOfWeek, endOfMonth, formatShort, formatLong, formatDayHeading } from "./dates.js";

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
  it("returns the 6 days from Sunday to Friday", () => {
    expect(weekDays("2026-10-11")).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
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

describe("formatWeekRange", () => {
  it("shows one month once", () => {
    expect(formatWeekRange("2026-10-11")).toBe("Oct 11 – 16, 2026");
  });

  it("shows both months when the week crosses a month", () => {
    expect(formatWeekRange("2026-11-29")).toBe("Nov 29 – Dec 4, 2026");
  });

  it("shows both years when the week crosses a year", () => {
    expect(formatWeekRange("2026-12-27")).toBe("Dec 27, 2026 – Jan 1, 2027");
  });
});

describe("monthKey", () => {
  it("returns YYYY-MM", () => {
    expect(monthKey("2026-10-15")).toBe("2026-10");
  });
});

describe("endOfWeek", () => {
  it("returns the coming Friday", () => {
    expect(endOfWeek("2026-10-15")).toBe("2026-10-16");
    expect(endOfWeek("2026-10-16")).toBe("2026-10-16");
  });

  it("rolls a Saturday forward to the next Friday", () => {
    expect(endOfWeek("2026-10-17")).toBe("2026-10-23");
  });
});

describe("endOfMonth", () => {
  it("returns the month's last day", () => {
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(endOfMonth("2026-10-15")).toBe("2026-10-31");
  });
});

describe("formatShort", () => {
  it("returns month and day", () => {
    expect(formatShort("2026-10-31")).toBe("Oct 31");
  });
});

describe("formatLong", () => {
  it("shows month, day and year", () => {
    expect(formatLong("2026-10-15")).toBe("Oct 15, 2026");
    expect(formatLong("2027-01-05")).toBe("Jan 5, 2027");
  });
});

describe("formatDayHeading", () => {
  it("gives the full weekday, short month and day", () => {
    expect(formatDayHeading("2026-10-19")).toBe("Monday, Oct 19");
    expect(formatDayHeading("2026-11-01")).toBe("Sunday, Nov 1");
  });
});
