import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import TaskItem from "./TaskItem.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const task = { id: "t1", text: "Gym", date: "2026-10-19", done: false, priority: "high" };

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const actions = { toggle: vi.fn(), edit: vi.fn(), setPriority: vi.fn(), move: vi.fn(), remove: vi.fn() };
  act(() =>
    root.render(
      <ul>
        <TaskItem task={task} actions={actions} {...props} />
      </ul>
    )
  );
  return actions;
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const sheet = () => document.body.querySelector("[role='dialog'][aria-label='Edit task']");

describe("TaskItem", () => {
  it("shows a priority dot with a readable label", () => {
    render();
    const dot = container.querySelector(".priority-dot");
    expect(dot.getAttribute("aria-label")).toBe("High priority");
    expect(dot.classList.contains("priority-dot-high")).toBe(true);
  });

  it("labels medium and low dots too", () => {
    render({ task: { ...task, priority: "low" } });
    expect(container.querySelector(".priority-dot").getAttribute("aria-label")).toBe("Low priority");
  });

  it("has no priority dropdown or edit/delete buttons on the row", () => {
    render();
    expect(container.querySelector("select")).toBeNull();
    expect(container.querySelector("button[aria-label='Edit']")).toBeNull();
    expect(container.querySelector("button[aria-label='Delete']")).toBeNull();
    expect(container.textContent).not.toContain("✏️");
    expect(container.textContent).not.toContain("🗑");
  });

  it("keeps the mark and overdue label, and shows done with the ticked box instead of ✓", () => {
    render({ task: { ...task, done: true }, mark: "🔁", label: "Tue" });
    const text = container.querySelector(".task-text").textContent;
    expect(text).not.toContain("✓");
    expect(text).toContain("🔁");
    expect(text).toContain("(Tue)");
    expect(container.querySelector(".check-box input").checked).toBe(true);
  });

  it("keeps a real checkbox inside a label, with the drawn box hidden from screen readers", () => {
    render();
    const input = container.querySelector("label.check-box > input[type='checkbox']");
    expect(input.getAttribute("aria-label")).toBe("Done: Gym");
    expect(container.querySelector(".check-box-face").getAttribute("aria-hidden")).toBe("true");
  });

  it("checkbox ticks the task without opening the sheet", () => {
    const actions = render();
    act(() => container.querySelector("input[type='checkbox']").click());
    expect(actions.toggle).toHaveBeenCalledWith("t1", true);
    expect(sheet()).toBeNull();
  });

  it("clicking the drawn box (the label) ticks the task without opening the sheet", () => {
    const actions = render();
    act(() => container.querySelector(".check-box-face").click());
    expect(actions.toggle).toHaveBeenCalledOnce();
    expect(actions.toggle).toHaveBeenCalledWith("t1", true);
    expect(sheet()).toBeNull();
  });

  it("clicking the text opens the task sheet without ticking", () => {
    const actions = render();
    expect(sheet()).toBeNull();
    act(() => container.querySelector(".task-text").click());
    expect(sheet()).not.toBeNull();
    expect(sheet().querySelector("input[aria-label='Task']").value).toBe("Gym");
    expect(actions.toggle).not.toHaveBeenCalled();
  });

  it("clicking elsewhere on the row opens the task sheet", () => {
    render();
    act(() => container.querySelector("li").click());
    expect(sheet()).not.toBeNull();
  });

  it("closing the sheet by its backdrop doesn't reopen it", () => {
    render();
    act(() => container.querySelector(".task-text").click());
    act(() => document.body.querySelector(".modal-backdrop").click());
    expect(sheet()).toBeNull();
  });

  it("Enter on the focused text opens the task sheet", () => {
    render();
    act(() =>
      container.querySelector(".task-text").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    expect(sheet()).not.toBeNull();
  });

  it("stays draggable when asked", () => {
    render({ draggable: true });
    expect(container.querySelector("li").getAttribute("draggable")).toBe("true");
  });
});
