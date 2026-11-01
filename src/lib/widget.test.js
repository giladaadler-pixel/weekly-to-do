import { describe, it, expect } from "vitest";
import { widgetPayload, widgetLink } from "./widget.js";

const rows = [
  { id: "a", text: "Gym & run", done: false, priority: "high" },
  { id: "b", text: "Read", done: true, priority: "low", repeat: { id: "b" } },
];

describe("widgetPayload", () => {
  it("keeps only text, done and priority for each row", () => {
    expect(widgetPayload(rows, "2026-11-01")).toEqual({
      d: "2026-11-01",
      t: [
        { x: "Gym & run", d: false, p: "high" },
        { x: "Read", d: true, p: "low" },
      ],
    });
  });
});

describe("widgetLink", () => {
  it("runs the Scriptable script with the day's list", () => {
    const link = widgetLink(rows, "2026-11-01");
    expect(link.startsWith("scriptable:///run/To-Do%20Widget?data=")).toBe(true);
    const data = new URL(link.replace("scriptable:///", "https://x/")).searchParams.get("data");
    expect(JSON.parse(data)).toEqual(widgetPayload(rows, "2026-11-01"));
  });
});
