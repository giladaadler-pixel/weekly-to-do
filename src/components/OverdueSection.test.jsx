import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import OverdueSection from "./OverdueSection.jsx";
import { makeRepeat } from "../lib/repeats.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const todayIso = "2026-10-22";
const task = { id: "t1", text: "Call bank", date: "2026-10-20", done: false, priority: "high" };
// Tue and Thu from Oct 11, never done: missed Oct 13, 15 and 20 by Thursday Oct 22.
const repeat = { ...makeRepeat({ text: "Gym", days: [2, 4], startDate: "2026-10-11" }), id: "r1" };

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const taskActions = { toggle: vi.fn(), edit: vi.fn(), setPriority: vi.fn(), move: vi.fn(), remove: vi.fn() };
  const repeatActions = { makeUp: vi.fn(), clearAll: vi.fn() };
  act(() =>
    root.render(
      <OverdueSection
        tasks={[task]}
        repeats={[repeat]}
        todayIso={todayIso}
        taskActions={taskActions}
        repeatActions={repeatActions}
      />
    )
  );
  return { taskActions, repeatActions };
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const button = (label) => container.querySelector(`button[aria-label="${label}"]`);

describe("OverdueSection", () => {
  it("counts overdue tasks plus missed repeats in the heading", () => {
    render();
    expect(container.querySelector(".overdue-heading").textContent).toBe("Carried over · 2");
  });

  it("labels a task with its day and a repeat with its missed count", () => {
    render();
    const tags = [...container.querySelectorAll(".overdue-tag")].map((t) => t.textContent);
    expect(tags).toEqual(["Tue", "3×"]);
  });

  it("ticks a task done and makes up a repeat", () => {
    const { taskActions, repeatActions } = render();
    act(() => container.querySelector("input[aria-label='Done: Call bank']").click());
    expect(taskActions.toggle).toHaveBeenCalledWith("t1", true);
    act(() => container.querySelector("input[aria-label='Make up one: Gym']").click());
    expect(repeatActions.makeUp).toHaveBeenCalledWith("r1");
  });

  it("skips a task to today and clears a repeat's missed days", () => {
    const { taskActions, repeatActions } = render();
    act(() => button("Skip overdue: Call bank").click());
    expect(taskActions.move).toHaveBeenCalledWith("t1", todayIso);
    act(() => button("Skip overdue: Gym").click());
    expect(repeatActions.clearAll).toHaveBeenCalledWith("r1");
  });
});
