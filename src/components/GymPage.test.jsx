import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import GymPage from "./GymPage.jsx";
import RestTimer from "./RestTimer.jsx";
import { IDLE_SESSION, startSession, startTimer } from "../lib/restTimer.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
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

function renderGym(session = IDLE_SESSION, actions = timerActions()) {
  act(() =>
    root.render(
      <GymPage gym={gym} todayIso="2026-10-28" gymActions={gymActions} gymSession={{ session, left: 90, actions }} />,
    ),
  );
  return actions;
}

const button = (text) => [...container.querySelectorAll("button")].find((b) => b.textContent.trim() === text);

describe("GymPage", () => {
  it("puts goals first, then the log and rest timer, with no Sun–Sat strip", () => {
    renderGym();
    const order = [...container.querySelectorAll("h2")].map((h) => h.textContent.trim());
    expect(order).toEqual(["Strength goals", "Log a set", "Rest timer", "Set history"]);
    expect(container.querySelector(".gym-strip")).toBe(null);
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
