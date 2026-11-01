import { describe, it, expect } from "vitest";
import { makeEvent, setReminder, dueReminders, reminderMessage, formatReminder, cleanReminder } from "./schedule.js";
import { loadFired, saveFired, FIRED_KEY } from "./eventAlerts.js";
import { buildWorkoutIcs } from "./ics.js";

const at = (iso, h, m = 0) => {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m);
};

describe("event reminders", () => {
  const gym = makeEvent({ date: "2026-11-02", start: 18 * 60, length: 60, title: "Gym", reminder: 10 });

  it("saves the chosen reminder, and none when left out", () => {
    expect(gym.reminder).toBe(10);
    expect("reminder" in makeEvent({ date: "2026-11-02", start: 0, length: 60, title: "x" })).toBe(false);
    expect(cleanReminder("abc")).toBe(null);
  });

  it("changes or removes a reminder", () => {
    expect(setReminder([gym], gym.id, 60)[0].reminder).toBe(60);
    expect("reminder" in setReminder([gym], gym.id, null)[0]).toBe(false);
  });

  it("is due from the alert time until the event starts", () => {
    expect(dueReminders([gym], at("2026-11-02", 17, 49))).toHaveLength(0);
    const due = dueReminders([gym], at("2026-11-02", 17, 50));
    expect(due).toHaveLength(1);
    expect(due[0].minutesLeft).toBe(10);
    expect(reminderMessage(due[0])).toBe("Gym starts in 10 minutes · 6:00 PM");
    expect(dueReminders([gym], at("2026-11-02", 18, 1))).toHaveLength(0);
  });

  it("doesn't show the same alert twice", () => {
    const due = dueReminders([gym], at("2026-11-02", 17, 55));
    expect(dueReminders([gym], at("2026-11-02", 17, 56), new Set([due[0].key]))).toHaveLength(0);
  });

  it("finds a 1 day before reminder for tomorrow, and weekly events every week", () => {
    const day = { ...gym, reminder: 1440 };
    const due = dueReminders([day], at("2026-11-01", 18, 0));
    expect(due[0].date).toBe("2026-11-02");
    expect(reminderMessage(due[0])).toBe("Gym starts tomorrow · 6:00 PM");
    const weekly = { ...gym, repeat: "weekly" };
    expect(dueReminders([weekly], at("2026-11-09", 17, 55))[0].date).toBe("2026-11-09");
  });

  it("at start time says starting now", () => {
    const now = { ...gym, reminder: 0 };
    expect(reminderMessage(dueReminders([now], at("2026-11-02", 18, 0))[0])).toBe("Gym is starting now · 6:00 PM");
  });

  it("labels like Google Calendar", () => {
    expect(formatReminder(30)).toBe("30 minutes before");
    expect(formatReminder(60)).toBe("1 hour before");
    expect(formatReminder(null)).toBe("No notification");
  });

  it("remembers shown alerts under its own key", () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    saveFired(new Set(["a@2026-11-02"]), storage, at("2026-11-02", 9));
    expect(store.has(FIRED_KEY)).toBe(true);
    expect(store.has("weekly-to-do:v1")).toBe(false);
    expect(loadFired(storage).has("a@2026-11-02")).toBe(true);
  });

  it("phone calendar file uses the chosen alert time", () => {
    const ics = buildWorkoutIcs({ title: "Gym", date: "2026-11-02", start: 1080, length: 60, reminder: 30, uid: "u" });
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(buildWorkoutIcs({ title: "Gym", date: "2026-11-02", start: 1080, length: 60, reminder: null, uid: "u" })).not.toContain("VALARM");
  });
});
