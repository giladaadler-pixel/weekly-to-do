import { describe, it, expect } from "vitest";
import { exportBackup, parseBackup, backupFileName } from "./backup.js";
import { DEFAULT_STATE } from "./storage.js";

const state = {
  ...DEFAULT_STATE,
  tasks: [{ id: "1", text: "Gym", date: "2026-10-19", done: false, priority: "high" }],
  notes: [
    { id: "n1", goalId: "g1", text: "Ran 5k\nfelt good", date: "2026-10-19" },
    { id: "n2", goalId: null, text: "Idea", date: "2026-10-18" },
  ],
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
  it("round-trips an exported backup, notes included", () => {
    const parsed = parseBackup(exportBackup(state));
    expect(parsed).toEqual(state);
    expect(parsed.notes).toHaveLength(2);
  });

  it("gives an old backup without notes an empty notes list", () => {
    expect(parseBackup(JSON.stringify({ tasks: [] })).notes).toEqual([]);
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
