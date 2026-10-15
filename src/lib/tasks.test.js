import { describe, it, expect } from "vitest";
import { makeTask, updateTask, deleteTask, editText, sortTasks, overdueTasks, overdueLabel } from "./tasks.js";

const t = { id: "t1", text: "Gym", date: "2026-10-15", done: false, priority: "medium" };

describe("makeTask", () => {
  it("ignores blank text", () => {
    expect(makeTask("   ", "2026-10-15")).toBeNull();
  });

  it("trims text and fills defaults", () => {
    const task = makeTask(" Gym ", "2026-10-15");
    expect(task).toMatchObject({ text: "Gym", date: "2026-10-15", done: false, priority: "medium" });
    expect(typeof task.id).toBe("string");
  });
});

describe("updateTask", () => {
  it("changes only the matching task", () => {
    const other = { ...t, id: "t2" };
    expect(updateTask([t, other], "t1", { done: true })).toEqual([{ ...t, done: true }, other]);
  });
});

describe("editText", () => {
  it("keeps the old text when the new text is blank", () => {
    expect(editText([t], t.id, "  ")[0].text).toBe(t.text);
  });

  it("saves trimmed new text", () => {
    expect(editText([t], t.id, " Run ")[0].text).toBe("Run");
  });
});

describe("deleteTask", () => {
  it("removes the task", () => {
    expect(deleteTask([t], t.id)).toEqual([]);
  });
});

describe("sortTasks", () => {
  it("puts unfinished tasks first and done tasks last, keeping order", () => {
    const a = { ...t, id: "a", done: true };
    const b = { ...t, id: "b" };
    const c = { ...t, id: "c", done: true };
    const d = { ...t, id: "d" };
    expect(sortTasks([a, b, c, d]).map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("sortTasks with priorities", () => {
  it("orders unfinished tasks high → medium → low, then done tasks", () => {
    const low = { ...t, id: "low", priority: "low" };
    const high = { ...t, id: "high", priority: "high" };
    const medium = { ...t, id: "medium", priority: "medium" };
    const doneHigh = { ...t, id: "doneHigh", priority: "high", done: true };
    expect(sortTasks([low, doneHigh, high, medium]).map((x) => x.id)).toEqual([
      "high",
      "medium",
      "low",
      "doneHigh",
    ]);
  });
});

describe("overdueTasks", () => {
  it("returns unfinished tasks from before today, oldest first", () => {
    const tasks = [
      { ...t, id: "1", date: "2026-10-14" },
      { ...t, id: "2", date: "2026-10-13", done: true },
      { ...t, id: "3", date: "2026-10-15" },
      { ...t, id: "4", date: "2026-10-20" },
      { ...t, id: "5", date: "2026-10-01" },
    ];
    expect(overdueTasks(tasks, "2026-10-15").map((x) => x.date)).toEqual(["2026-10-01", "2026-10-14"]);
  });
});

describe("overdueLabel", () => {
  it("uses the day name within the last 6 days", () => {
    expect(overdueLabel("2026-10-13", "2026-10-15")).toBe("Tue");
  });

  it("uses month and day for older dates", () => {
    expect(overdueLabel("2026-10-05", "2026-10-15")).toBe("Oct 5");
  });
});
