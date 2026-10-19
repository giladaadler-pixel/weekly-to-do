import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import GoalsBand from "./GoalsBand.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const run = {
  id: "g1",
  title: "Run a 10k",
  priority: "high",
  dueDate: "2026-06-01",
  style: "checklist",
  items: [{ text: "Buy shoes", done: false }],
  done: false,
};
const read = {
  id: "g2",
  title: "Read 12 books",
  priority: "low",
  style: "paragraph",
  text: "One a month",
  items: [],
  done: false,
};

function makeActions() {
  return { create: vi.fn(), update: vi.fn(), setDone: vi.fn(), replace: vi.fn(), remove: vi.fn() };
}

// Chips are tested inside GoalsBand, which decides which one is expanded.
function render(goals = [run, read]) {
  const actions = makeActions();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<GoalsBand goals={goals} todayIso="2026-10-19" goalActions={actions} />));
  return actions;
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.querySelectorAll(".celebration").forEach((el) => el.remove());
});

const chip = (title) => [...container.querySelectorAll(".goal-chip")].find((c) => c.textContent.includes(title));
const header = (title) => chip(title).querySelector(".goal-chip-header");
const isExpanded = (title) => chip(title).classList.contains("expanded");
const button = (el, name) => [...el.querySelectorAll("button")].find((b) => b.textContent === name);

describe("GoalChip collapsed", () => {
  it("shows the priority dot, title and due date", () => {
    render();
    const c = chip("Run a 10k");
    expect(c.querySelector(".priority-dot").getAttribute("aria-label")).toBe("High priority");
    expect(c.textContent).toContain("Run a 10k");
    expect(c.textContent).toContain("Due Jun 1");
  });

  it("leaves out the due date when there is none", () => {
    render();
    expect(chip("Read 12 books").textContent).not.toContain("Due");
  });

  it("hides the description and controls", () => {
    render();
    const c = chip("Run a 10k");
    expect(c.textContent).not.toContain("Buy shoes");
    expect(c.querySelector("select")).toBeNull();
    expect(c.querySelector("button[aria-label='Delete goal']")).toBeNull();
  });

  it("starts collapsed", () => {
    render();
    expect(isExpanded("Run a 10k")).toBe(false);
    expect(isExpanded("Read 12 books")).toBe(false);
  });
});

describe("GoalChip expanding", () => {
  it("clicking expands it to show the description and controls", () => {
    render();
    act(() => header("Run a 10k").click());
    const c = chip("Run a 10k");
    expect(isExpanded("Run a 10k")).toBe(true);
    expect(c.textContent).toContain("Buy shoes");
    expect(c.querySelector("select[aria-label='Priority']")).not.toBeNull();
    expect(c.querySelector("select[aria-label='Description style']")).not.toBeNull();
    expect(c.querySelector("button[aria-label='Delete goal']")).not.toBeNull();
  });

  it("clicking the header again collapses it", () => {
    render();
    act(() => header("Run a 10k").click());
    act(() => header("Run a 10k").click());
    expect(isExpanded("Run a 10k")).toBe(false);
  });

  it("ticking a checklist item updates the goal and stays expanded", () => {
    const actions = render();
    act(() => header("Run a 10k").click());
    act(() => chip("Run a 10k").querySelector(".goal-checklist input").click());
    expect(actions.update).toHaveBeenCalledWith("g1", { items: [{ text: "Buy shoes", done: true }] });
    expect(isExpanded("Run a 10k")).toBe(true);
  });

  it("only one chip is expanded at a time", () => {
    render();
    act(() => header("Run a 10k").click());
    act(() => header("Read 12 books").click());
    expect(isExpanded("Run a 10k")).toBe(false);
    expect(isExpanded("Read 12 books")).toBe(true);
  });

  it("Escape collapses it", () => {
    render();
    act(() => header("Run a 10k").click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(isExpanded("Run a 10k")).toBe(false);
  });
});

describe("GoalChip ✓", () => {
  it("marks the goal done without expanding it", () => {
    const actions = render();
    act(() => chip("Run a 10k").querySelector("button[aria-label='Mark goal done']").click());
    expect(actions.setDone).toHaveBeenCalledWith("g1", true);
    expect(isExpanded("Run a 10k")).toBe(false);
  });
});

describe("GoalChip delete", () => {
  it("asks first, and Cancel keeps the goal", () => {
    const actions = render();
    act(() => header("Run a 10k").click());
    act(() => chip("Run a 10k").querySelector("button[aria-label='Delete goal']").click());
    expect(chip("Run a 10k").textContent).toContain("Delete this goal?");
    expect(actions.remove).not.toHaveBeenCalled();
    act(() => button(chip("Run a 10k"), "Cancel").click());
    expect(actions.remove).not.toHaveBeenCalled();
    expect(chip("Run a 10k").textContent).not.toContain("Delete this goal?");
  });

  it("confirming deletes it", () => {
    const actions = render();
    act(() => header("Run a 10k").click());
    act(() => chip("Run a 10k").querySelector("button[aria-label='Delete goal']").click());
    act(() => button(chip("Run a 10k"), "Delete").click());
    expect(actions.remove).toHaveBeenCalledWith("g1");
  });
});
