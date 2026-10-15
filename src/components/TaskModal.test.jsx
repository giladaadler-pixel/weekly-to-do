import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import TaskModal from "./TaskModal.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<TaskModal onCreate={() => {}} onCancel={() => {}} {...props} />));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function typeTitle(text) {
  const input = container.querySelector("input[aria-label='Title']");
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  act(() => {
    setValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const submit = () => container.querySelector("button[type='submit']");

describe("TaskModal", () => {
  it("can't create a task with a blank title", () => {
    const onCreate = vi.fn();
    render({ onCreate });
    typeTitle("   ");
    expect(submit().disabled).toBe(true);
    act(() => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates a Medium one-off task by default", () => {
    const onCreate = vi.fn();
    render({ onCreate });
    typeTitle("Email Ari");
    act(() => submit().click());
    expect(onCreate).toHaveBeenCalledWith("Email Ari", "medium", []);
  });

  it("sends the picked repeat days", () => {
    const onCreate = vi.fn();
    render({ onCreate });
    typeTitle("Gym");
    const boxes = container.querySelectorAll(".day-picker input");
    act(() => boxes[2].click());
    act(() => boxes[4].click());
    act(() => submit().click());
    expect(onCreate).toHaveBeenCalledWith("Gym", "medium", [2, 4]);
  });

  it("cancels on Esc", () => {
    const onCancel = vi.fn();
    render({ onCancel });
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(onCancel).toHaveBeenCalled();
  });
});
