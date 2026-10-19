import { describe, it, expect } from "vitest";
import { exportBackup, parseBackup, backupFileName } from "./backup.js";
import { DEFAULT_STATE } from "./storage.js";

const state = {
  ...DEFAULT_STATE,
  tasks: [{ id: "1", text: "Gym", date: "2026-10-19", done: false, priority: "high" }],
  theme: "dark",
};

describe("exportBackup", () => {
  it("is pretty JSON of the whole state", () => {
    const text = exportBackup(state);
    expect(JSON.parse(text)).toEqual(state);
    expect(text).toContain("\n  ");
  });
});

describe("parseBackup", () => {
  it("round-trips an exported backup", () => {
    expect(parseBackup(exportBackup(state))).toEqual(state);
  });

  it("fills missing keys from the defaults, like loading saved data", () => {
    const parsed = parseBackup(JSON.stringify({ tasks: [] }));
    expect(parsed).toEqual(DEFAULT_STATE);
  });

  it("rejects broken JSON", () => {
    expect(parseBackup("{not json")).toBeNull();
  });

  it("rejects JSON that isn't an object with a tasks array", () => {
    expect(parseBackup("[]")).toBeNull();
    expect(parseBackup("null")).toBeNull();
    expect(parseBackup('"hello"')).toBeNull();
    expect(parseBackup(JSON.stringify({ goals: [] }))).toBeNull();
    expect(parseBackup(JSON.stringify({ tasks: "nope" }))).toBeNull();
  });
});

describe("backupFileName", () => {
  it("includes the date", () => {
    expect(backupFileName("2026-10-19")).toBe("weekly-to-do-backup-2026-10-19.json");
  });
});
