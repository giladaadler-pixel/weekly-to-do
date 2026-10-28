import { describe, it, expect } from "vitest";
import { buildReminderIcs, buildWorkoutIcs, escapeText, workoutFileName } from "./ics.js";

const URL_ = "https://giladaadler-pixel.github.io/weekly-to-do/";

function build(fields) {
  return buildReminderIcs({
    time: "08:00",
    url: URL_,
    todayIso: "2026-10-19",
    uid: "abc-123",
    now: new Date(Date.UTC(2026, 9, 19, 14, 5, 9)),
    ...fields,
  });
}

// Undo line folding (CRLF + space) so long lines can be checked whole.
const unfold = (text) => text.replace(/\r\n /g, "");
const lines = (text) => unfold(text).split("\r\n");

describe("buildReminderIcs", () => {
  it("uses CRLF line endings throughout, ending with one", () => {
    const text = build();
    expect(text.endsWith("\r\n")).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("wraps one event in a calendar", () => {
    const l = lines(build());
    expect(l[0]).toBe("BEGIN:VCALENDAR");
    expect(l).toContain("VERSION:2.0");
    expect(l).toContain("PRODID:-//Weekly To-Do//EN");
    expect(l.filter((x) => x === "BEGIN:VEVENT")).toHaveLength(1);
    expect(l.at(-2)).toBe("END:VCALENDAR");
  });

  it("starts today at the chosen time in floating local time", () => {
    expect(lines(build())).toContain("DTSTART:20261019T080000");
    expect(lines(build({ time: "21:30" }))).toContain("DTSTART:20261019T213000");
  });

  it("repeats daily for 10 minutes", () => {
    const l = lines(build());
    expect(l).toContain("RRULE:FREQ=DAILY");
    expect(l).toContain("DURATION:PT10M");
  });

  it("has the uid, a UTC timestamp, title and app link", () => {
    const l = lines(build());
    expect(l).toContain("UID:abc-123");
    expect(l).toContain("DTSTAMP:20261019T140509Z");
    expect(l).toContain("SUMMARY:Check your to-do list ✅");
    expect(l).toContain(`URL:${URL_}`);
    expect(l.find((x) => x.startsWith("DESCRIPTION:"))).toContain(URL_);
  });

  it("alerts at the event time", () => {
    const text = unfold(build());
    expect(text).toContain("BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Check your to-do list ✅\r\nTRIGGER:PT0M\r\nEND:VALARM");
  });

  it("folds lines longer than 75 bytes", () => {
    for (const line of build().split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("escapeText", () => {
  it("escapes backslashes, commas, semicolons and newlines", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
});

describe("buildWorkoutIcs", () => {
  const base = { title: "Push; heavy, day", date: "2026-10-28", start: 18 * 60 + 30, length: 60, uid: "u1@x", now: new Date(Date.UTC(2026, 9, 28, 12)) };

  it("is one floating-time event with a 15-minute alert, escaped", () => {
    const ics = buildWorkoutIcs(base);
    const lines = ics.split("\r\n");
    expect(lines).toContain("DTSTART:20261028T183000");
    expect(lines).toContain("DURATION:PT60M");
    expect(lines).toContain("TRIGGER:-PT15M");
    expect(lines).toContain("SUMMARY:Push\\; heavy\\, day");
    expect(ics).not.toContain("RRULE");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("repeats weekly when asked", () => {
    expect(buildWorkoutIcs({ ...base, weekly: true }).split("\r\n")).toContain("RRULE:FREQ=WEEKLY");
  });

  it("makes a safe file name", () => {
    expect(workoutFileName("Push day")).toBe("Push day.ics");
    expect(workoutFileName('Arms/abs: "max"?')).toBe("Armsabs max.ics");
    expect(workoutFileName("///")).toBe("workout.ics");
  });
});

