import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import GymPage from "./GymPage.jsx";
import RestTimer from "./RestTimer.jsx";
import { IDLE_SESSION, startSession, startTimer } from "../lib/restTimer.js";
import { TAB_KEY } from "./GymTabs.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const gym = { logs: [], lifts: [{ id: "g1", lift: "Bench press", target: 225, due: "" }], customLifts: [] };
const gymActions = {
  addLog: vi.fn(() => true),
  removeLog: vi.fn(),
  addLift: vi.fn(),
  removeLift: vi.fn(),
  addExercise: vi.fn(),
  forgetLift: vi.fn(),
};
const timerActions = () => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
  start: vi.fn(),
  pause: vi.fn(),
  reset: vi.fn(),
  setDuration: vi.fn(),
});

function renderGym(session = IDLE_SESSION, actions = timerActions(), g = gym) {
  act(() =>
    root.render(
      <GymPage gym={g} todayIso="2026-10-28" gymActions={gymActions} gymSession={{ session, left: 90, actions }} />,
    ),
  );
  return actions;
}

const tab = (label) => [...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent === label);
const headings = () => [...container.querySelectorAll("h2")].map((h) => h.textContent.trim());

function typeInto(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const button = (text) => [...container.querySelectorAll("button")].find((b) => b.textContent.trim() === text);

describe("GymPage", () => {
  it("opens on the Workout tab: the log and rest timer, with no Sun–Sat strip", () => {
    renderGym();
    expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
    expect(headings()).toEqual(["Log a set", "Rest timer"]);
    expect(container.querySelector(".gym-strip")).toBe(null);
  });

  it("switches tabs by click and arrow keys, and remembers the last one", () => {
    renderGym();
    act(() => tab("History").click());
    expect(headings()).toEqual(["Strength goals", "Set history"]);
    expect(container.querySelector('[role="tabpanel"]').getAttribute("aria-labelledby")).toBe("gym-tab-history");
    expect(localStorage.getItem(TAB_KEY)).toBe("history");
    act(() => tab("History").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("Workout"));
    act(() => root.unmount());
    localStorage.setItem(TAB_KEY, "exercises");
    root = createRoot(container);
    renderGym();
    expect(tab("Exercises").getAttribute("aria-selected")).toBe("true");
  });

  it("falls back to Workout when the saved tab is unknown", () => {
    localStorage.setItem(TAB_KEY, "nope");
    renderGym();
    expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
  });

  it("shows a 90 second rest timer that starts by hand", () => {
    const actions = renderGym();
    expect(container.querySelector(".rest-clock").textContent).toBe("1:30");
    act(() => button("Start rest").click());
    expect(actions.start).toHaveBeenCalled();
  });

  it("logging a set does not start the timer", () => {
    const actions = renderGym();
    act(() => container.querySelector(".log-form").dispatchEvent(new Event("submit", { bubbles: true })));
    expect(actions.start).not.toHaveBeenCalled();
  });

  it("starts and ends a gym session", () => {
    const actions = renderGym();
    act(() => button("Start gym session").click());
    expect(actions.startSession).toHaveBeenCalled();
    renderGym(startSession(IDLE_SESSION, 0), actions);
    act(() => button("End session").click());
    expect(actions.endSession).toHaveBeenCalled();
  });

  it("lets you pick a rest length", () => {
    const actions = renderGym();
    act(() => button("2:00").click());
    expect(actions.setDuration).toHaveBeenCalledWith(120);
    act(() => container.querySelector('[aria-label="15 seconds longer"]').click());
    expect(actions.setDuration).toHaveBeenCalledWith(105);
  });
});

describe("RestTimer compact (Week page)", () => {
  it("shows pause while running and links back to the gym", () => {
    const onOpenGym = vi.fn();
    const actions = timerActions();
    act(() =>
      root.render(
        <RestTimer compact session={startTimer(IDLE_SESSION, 0)} left={42} actions={actions} onOpenGym={onOpenGym} />,
      ),
    );
    expect(container.querySelector(".rest-clock").textContent).toBe("0:42");
    act(() => button("Pause").click());
    expect(actions.pause).toHaveBeenCalled();
    act(() => button("Open gym").click());
    expect(onOpenGym).toHaveBeenCalled();
  });
});

describe("Exercises tab", () => {
  function openExercises(g) {
    localStorage.setItem(TAB_KEY, "exercises");
    renderGym(IDLE_SESSION, timerActions(), g);
  }
  const submit = () =>
    act(() => container.querySelector(".exercise-add").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

  it("adds a tidied new exercise, and refuses a blank one", () => {
    gymActions.addExercise.mockClear();
    openExercises({ ...gym, customLifts: [] });
    submit();
    expect(container.querySelector(".field-error").textContent).toBe("Enter an exercise name");
    expect(gymActions.addExercise).not.toHaveBeenCalled();
    typeInto(container.querySelector("#new-exercise"), "  pec   fly ");
    submit();
    expect(gymActions.addExercise).toHaveBeenCalledWith("pec fly");
  });

  it("doesn't add a duplicate, ignoring case", () => {
    gymActions.addExercise.mockClear();
    openExercises({ ...gym, customLifts: ["Pec fly"] });
    typeInto(container.querySelector("#new-exercise"), "BENCH PRESS");
    submit();
    typeInto(container.querySelector("#new-exercise"), "pec FLY");
    submit();
    expect(gymActions.addExercise).not.toHaveBeenCalled();
    expect(container.querySelector('[role="status"]').textContent).toBe("Pec fly is already on your list.");
  });

  it("lists built-ins without remove, and removes your own", () => {
    gymActions.forgetLift.mockClear();
    openExercises({ ...gym, customLifts: ["Pec fly"] });
    const removes = container.querySelectorAll(".exercise-row button");
    expect(removes).toHaveLength(1);
    expect(removes[0].getAttribute("aria-label")).toBe("Remove Pec fly from your list. Its sets and plans stay.");
    act(() => removes[0].click());
    expect(gymActions.forgetLift).toHaveBeenCalledWith("Pec fly");
  });
});
