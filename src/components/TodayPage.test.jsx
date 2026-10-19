import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import TodayPage from "./TodayPage.jsx";
import { updateTask } from "../lib/tasks.js";
import { toggleDoneOn } from "../lib/repeats.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TODAY = "2026-10-19"; // a Monday

let container;
let root;

const gym = { id: "a", text: "Gym", date: TODAY, done: false, priority: "high" };
const mail = { id: "b", text: "Mail", date: TODAY, done: true, priority: "low" };
const friday = { id: "c", text: "Friday thing", date: "2026-10-16", done: true, priority: "low" };
const stretch = {
  id: "r1",
  text: "Stretch",
  days: [1],
  priority: "medium",
  startDate: "2026-10-01",
  endDate: null,
  goalId: null,
  doneDates: [],
  skipDates: [],
  clearedThrough: null,
};

// Holds real state so checking a task off re-renders the counts.
function Harness({ initial, add }) {
  const [state, setState] = useState(initial);
  const taskActions = {
    add,
    toggle: (id, done) => setState((s) => ({ ...s, tasks: updateTask(s.tasks, id, { done }) })),
    edit: () => {},
    setPriority: () => {},
    move: () => {},
    remove: () => {},
  };
  const repeatActions = {
    toggle: (id, date) =>
      setState((s) => ({ ...s, repeats: s.repeats.map((r) => (r.id === id ? toggleDoneOn(r, date) : r)) })),
    setPriority: () => {},
    edit: () => {},
    deleteOne: () => {},
    deleteFuture: () => {},
    makeUp: () => {},
    clearAll: () => {},
  };
  const goalActions = { create: () => {}, update: () => {}, setDone: () => {}, replace: () => {}, remove: () => {} };
  return (
    <TodayPage
      state={state}
      todayIso={TODAY}
      taskActions={taskActions}
      repeatActions={repeatActions}
      goalActions={goalActions}
    />
  );
}

function render(initial, add = vi.fn()) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Harness initial={{ tasks: [], repeats: [], goals: [], ...initial }} add={add} />));
  return add;
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const rowTexts = () => [...container.querySelectorAll(".today-list .task-text")].map((e) => e.textContent);
const countText = () => container.querySelector(".today-count").textContent;
const checkbox = (name) => container.querySelector(`.today-list input[aria-label='Done: ${name}']`);

describe("TodayPage", () => {
  it("shows the date heading", () => {
    render({});
    expect(container.querySelector("h1").textContent).toBe("Monday, Oct 19");
  });

  it("shows today's tasks and repeat copies, not other days'", () => {
    render({ tasks: [gym, mail, friday], repeats: [stretch] });
    const texts = rowTexts();
    expect(texts.some((t) => t.includes("Gym"))).toBe(true);
    expect(texts.some((t) => t.includes("Stretch") && t.includes("🔁"))).toBe(true);
    expect(texts.some((t) => t.includes("Mail"))).toBe(true);
    expect(texts.some((t) => t.includes("Friday thing"))).toBe(false);
  });

  it("checking one off updates the done count", () => {
    render({ tasks: [gym, mail], repeats: [stretch] });
    expect(countText()).toBe("1 of 3 done today");
    act(() => checkbox("Gym").click());
    expect(countText()).toBe("2 of 3 done today");
    act(() => checkbox("Stretch").click());
    expect(countText()).toBe("3 of 3 done today");
  });

  it("shows the streak", () => {
    render({ tasks: [friday, { ...gym, done: true }] });
    expect(container.querySelector(".today-streak").textContent).toBe("🔥 2-day streak");
  });

  it("hides the streak when it's 0", () => {
    render({ tasks: [gym] });
    expect(container.querySelector(".today-streak")).toBeNull();
  });

  it("Create new task+ opens the task modal and adds the task to today", () => {
    const add = render({});
    act(() => container.querySelector(".today-create").click());
    const input = document.body.querySelector("input[aria-label='Title']");
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    act(() => {
      setValue.call(input, "Call mom");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => document.body.querySelector("form[aria-label='Create new task']").requestSubmit());
    expect(add).toHaveBeenCalledWith("Call mom", TODAY, "medium", []);
  });

  it("shows the empty state when nothing is planned", () => {
    render({ tasks: [friday] });
    expect(container.textContent).toContain("Nothing planned today. Add a task to get started.");
    expect(rowTexts()).toEqual([]);
  });

  it("shows this week's count and six labeled dots", () => {
    render({ tasks: [friday, gym, mail] });
    const box = container.querySelector(".this-week");
    expect(box.textContent).toContain("1 of 2 done");
    const dots = [...box.querySelectorAll(".week-dot")];
    expect(dots).toHaveLength(6);
    expect(dots.map((d) => d.dataset.letter).join("")).toBe("SMTWTF");
  });
});
