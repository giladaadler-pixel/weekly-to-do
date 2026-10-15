import { describe, it, expect } from "vitest";
import { makeTask, updateTask, deleteTask, editText, sortTasks } from "./tasks.js";

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
