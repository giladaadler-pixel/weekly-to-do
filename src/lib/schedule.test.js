import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatLength,
  makeEvent,
  eventsOn,
  eventsInHour,
  deleteEvent,
  scheduledMinutes,
} from "./schedule.js";

describe("schedule", () => {
  it("formats times and lengths", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(570)).toBe("09:30");
    expect(formatTime(24 * 60)).toBe("00:00");
    expect(formatLength(45)).toBe("45m");
    expect(formatLength(60)).toBe("1h");
    expect(formatLength(90)).toBe("1h 30m");
  });

  it("makes an event with a trimmed title, or null when blank", () => {
    const e = makeEvent({ date: "2026-10-27", start: 540, length: 60, title: "  Gym  " });
    expect(e).toMatchObject({ date: "2026-10-27", start: 540, length: 60, title: "Gym" });
    expect(e.id).toBeTruthy();
    expect(makeEvent({ date: "2026-10-27", start: 540, length: 60, title: "  " })).toBeNull();
  });

  it("keeps an event inside the day", () => {
    const e = makeEvent({ date: "d", start: 23 * 60 + 30, length: 120, title: "late" });
    expect(e.start + e.length).toBeLessThanOrEqual(24 * 60);
    expect(makeEvent({ date: "d", start: -30, length: 5, title: "x" })).toMatchObject({ start: 0, length: 15 });
  });

  it("lists a day's events earliest first and groups them by hour", () => {
    const events = [
      { id: "a", date: "2026-10-27", start: 600, length: 30, title: "b" },
      { id: "b", date: "2026-10-27", start: 540, length: 30, title: "a" },
      { id: "c", date: "2026-10-28", start: 500, length: 30, title: "other day" },
    ];
    const day = eventsOn(events, "2026-10-27");
    expect(day.map((e) => e.id)).toEqual(["b", "a"]);
    expect(eventsInHour(day, 9).map((e) => e.id)).toEqual(["b"]);
    expect(eventsInHour(day, 8)).toEqual([]);
    expect(scheduledMinutes(day)).toBe(60);
    expect(deleteEvent(events, "a").map((e) => e.id)).toEqual(["b", "c"]);
  });
});
