import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import TaskSheet from "./TaskSheet.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const oneOff = { id: "t1", text: "Gym", date: "2026-10-19", done: false, priority: "medium" };
const repeatCopy = { id: "r1", text: "Read", done: false, priority: "low", repeat: { id: "r1" } };

function makeActions() {
  return { edit: vi.fn(), setPriority: vi.fn(), move: vi.fn(), remove: vi.fn() };
}

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<TaskSheet task={oneOff} actions={makeActions()} onClose={() => {}} {...props} />));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// The sheet renders into document.body through a portal.
const $ = (selector) => document.body.querySelector(selector);
const textInput = () => $("input[aria-label='Task']");
const prioritySelect = () => $("select[aria-label='Priority']");
const dateInput = () => $("input[aria-label='Date']");
const button = (name) => [...document.body.querySelectorAll(".modal button")].find((b) => b.textContent === name);

function setInput(input, value) {
  const proto = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setValue = Object.getOwnPropertyDescriptor(proto, "value").set;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

describe("TaskSheet", () => {
  it("is prefilled with the task's text, priority and date", () => {
    render();
    expect(textInput().value).toBe("Gym");
    expect(prioritySelect().value).toBe("medium");
    expect(dateInput().value).toBe("2026-10-19");
  });

  it("saves edited text and priority", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    setInput(textInput(), "Gym at 7");
    setInput(prioritySelect(), "high");
    act(() => button("Save").click());
    expect(actions.edit).toHaveBeenCalledWith("t1", "Gym at 7");
    expect(actions.setPriority).toHaveBeenCalledWith("t1", "high");
    expect(actions.move).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("changing the date moves a one-off task", () => {
    const actions = makeActions();
    render({ actions });
    setInput(dateInput(), "2026-10-21");
    act(() => button("Save").click());
    expect(actions.move).toHaveBeenCalledWith("t1", "2026-10-21");
  });

  it("blank text keeps the old text", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    setInput(textInput(), "   ");
    act(() => button("Save").click());
    expect(actions.edit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Delete removes a one-off task", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    act(() => button("Delete").click());
    expect(actions.remove).toHaveBeenCalledWith("t1");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("has no date field for a repeat copy", () => {
    render({ task: repeatCopy });
    expect(dateInput()).toBeNull();
  });

  it("Delete on a repeat shows the choices instead of deleting", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    const justThisDay = vi.fn();
    const future = vi.fn();
    render({
      task: repeatCopy,
      actions,
      onClose,
      deleteChoices: [
        { label: "Just this day", onClick: justThisDay },
        { label: "This and all future days", onClick: future },
      ],
    });
    act(() => button("Delete").click());
    expect(actions.remove).not.toHaveBeenCalled();
    expect(button("Just this day")).toBeTruthy();
    expect(button("This and all future days")).toBeTruthy();
    act(() => button("Just this day").click());
    expect(justThisDay).toHaveBeenCalledOnce();
    expect(future).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Cancel closes without changing anything", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    setInput(textInput(), "Changed");
    act(() => button("Cancel").click());
    expect(onClose).toHaveBeenCalledOnce();
    for (const fn of Object.values(actions)) expect(fn).not.toHaveBeenCalled();
  });

  it("Escape closes without changing anything", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    setInput(textInput(), "Changed");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(onClose).toHaveBeenCalledOnce();
    for (const fn of Object.values(actions)) expect(fn).not.toHaveBeenCalled();
  });

  it("clicking outside closes without changing anything", () => {
    const actions = makeActions();
    const onClose = vi.fn();
    render({ actions, onClose });
    act(() => $(".modal-backdrop").click());
    expect(onClose).toHaveBeenCalledOnce();
    for (const fn of Object.values(actions)) expect(fn).not.toHaveBeenCalled();
  });
});
