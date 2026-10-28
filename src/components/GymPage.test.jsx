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

const gym = { logs: [], lifts: [{ id: "g1", lift: "Bench press", target: 225, due: "" }], customLifts: [], plans: [] };
const gymActions = {
  addLog: vi.fn(() => true),
  removeLog: vi.fn(),
  addLift: vi.fn(),
  removeLift: vi.fn(),
  addExercise: vi.fn(),
  forgetLift: vi.fn(),
  savePlan: vi.fn(() => true),
  deletePlan: vi.fn(),
};
const timerActions = () => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
  start: vi.fn(),
  afterSet: vi.fn(),
  pause: vi.fn(),
  reset: vi.fn(),
  setDuration: vi.fn(),
});

function renderGym(session = IDLE_SESSION, actions = timerActions(), g = gym, onToast = vi.fn(), onAddEvent = vi.fn()) {
  act(() =>
    root.render(
      <GymPage
        gym={g}
        todayIso="2026-10-28"
        gymActions={gymActions}
        gymSession={{ session, left: 90, actions }}
        onToast={onToast}
        onAddEvent={onAddEvent}
      />,
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
  it("has two tabs and opens on Workout: plans, then the log and rest timer", () => {
    renderGym();
    expect([...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(["Workout", "History"]);
    expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
    expect(headings()).toEqual(["Your workout plans", "Log a set", "Rest timer"]);
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
    localStorage.setItem(TAB_KEY, "history");
    root = createRoot(container);
    renderGym();
    expect(tab("History").getAttribute("aria-selected")).toBe("true");
  });

  it("opens Workout when the remembered tab was the old Plans or Exercises tab", () => {
    for (const old of ["plans", "exercises", "nope"]) {
      localStorage.setItem(TAB_KEY, old);
      renderGym();
      expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
      act(() => root.unmount());
      root = createRoot(container);
    }
  });

  it("shows a 90 second rest timer that starts by hand", () => {
    const actions = renderGym();
    expect(container.querySelector(".rest-clock").textContent).toBe("1:30");
    act(() => button("Start rest").click());
    expect(actions.start).toHaveBeenCalled();
  });

  it("logging a set starts the rest timer, even with no session", () => {
    const actions = renderGym();
    act(() => container.querySelector(".log-form").dispatchEvent(new Event("submit", { bubbles: true })));
    expect(actions.afterSet).toHaveBeenCalled();
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

describe("Your workout plans", () => {
  const push = { id: "p1", name: "Push day", exercises: ["Bench press", "Overhead press", "Cable fly"] };
  const sheet = () => document.querySelector(".plan-sheet");
  const sheetButton = (text) => [...sheet().querySelectorAll("button")].find((b) => b.textContent.trim() === text);
  const saveSheet = () => act(() => sheet().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  const plansSection = () => container.querySelector(".gym-plans");

  beforeEach(() => {
    gymActions.savePlan.mockClear();
    gymActions.deletePlan.mockClear();
    gymActions.addExercise.mockClear();
    gymActions.forgetLift.mockClear();
  });

  it("with no plans, says so and offers Add workout plan", () => {
    renderGym();
    expect(plansSection().textContent).toContain("No plans yet");
    expect(button("Add workout plan")).toBeTruthy();
    expect(plansSection().querySelector(".plan-card")).toBe(null);
  });

  it("shows each plan as a card with Start, Edit and Add to calendar", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] });
    const card = plansSection().querySelector(".plan-card");
    expect(card.querySelector("h3").textContent).toBe("Push day");
    expect([...card.querySelectorAll(".plan-tag")].map((t) => t.textContent)).toEqual(push.exercises);
    expect([...card.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Start", "Edit", "Add to calendar"]);
  });

  it("Add workout plan opens an empty plan; a suggestion fills in the name", () => {
    renderGym();
    act(() => button("Add workout plan").click());
    expect(sheet().getAttribute("aria-label")).toBe("New plan");
    expect(sheet().querySelector("#plan-name").value).toBe("");
    expect([...sheet().querySelectorAll('[aria-label="Name suggestions"] button')].map((b) => b.textContent)).toEqual([
      "Push",
      "Pull",
      "Leg",
      "Upper",
      "Lower",
      "Full body",
    ]);
    act(() => sheetButton("Push").click());
    expect(sheet().querySelector("#plan-name").value).toBe("Push day");
    // Suggestions show, but the plan starts empty.
    const suggested = () => [...sheet().querySelectorAll('[aria-labelledby="plan-suggested"] button')];
    expect(suggested().map((b) => b.textContent)).toEqual([
      "Bench press",
      "Incline dumbbell press",
      "Chest fly",
      "Overhead press",
      "Lateral raises",
      "Front raises",
      "Triceps pushdowns",
      "Overhead triceps extensions",
    ]);
    expect(suggested().every((b) => b.getAttribute("aria-pressed") === "false")).toBe(true);
    expect(sheet().textContent).toContain("No exercises yet");
    // The full list stays closed until Other….
    expect(sheet().querySelector("#plan-all-exercises")).toBe(null);
    act(() => sheetButton("Bench press").click());
    act(() => sheetButton("Chest fly").click());
    act(() => sheetButton("Lateral raises").click());
    act(() => sheetButton("Lateral raises").click()); // tap again to take it out
    act(() => sheetButton("Overhead press").click());
    expect(sheetButton("Bench press").getAttribute("aria-pressed")).toBe("true");
    expect(sheetButton("Lateral raises").getAttribute("aria-pressed")).toBe("false");
    saveSheet();
    expect(gymActions.savePlan).toHaveBeenCalledWith({
      id: undefined,
      name: "Push day",
      exercises: ["Bench press", "Chest fly", "Overhead press"],
    });
    expect(sheet()).toBe(null);
  });

  it("other names show no suggestions, just Other…, which opens every exercise", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, customLifts: ["Pec fly"] });
    act(() => button("Add workout plan").click());
    typeInto(sheet().querySelector("#plan-name"), "Arms and abs");
    expect(sheet().querySelector('[aria-labelledby="plan-suggested"]')).toBe(null);
    const other = sheetButton("Other…");
    expect(other.getAttribute("aria-expanded")).toBe("false");
    act(() => other.click());
    expect(other.getAttribute("aria-expanded")).toBe("true");
    const all = [...sheet().querySelectorAll("#plan-all-exercises .plan-chip")].map((b) => b.textContent);
    expect(all).toEqual(["Bench press", "Squat", "Deadlift", "Overhead press", "Pull-up", "Pec fly"]);
    expect(sheet().querySelector('[aria-label="New exercise"]')).not.toBe(null);
  });

  it("a suggestion uses the spelling you already have", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, customLifts: ["chest FLY"] });
    act(() => button("Add workout plan").click());
    act(() => sheetButton("Push").click());
    expect(sheetButton("chest FLY")).toBeTruthy();
    expect(sheetButton("Chest fly")).toBeUndefined();
  });

  it("Upper day suggests the push and pull lists together", () => {
    renderGym();
    act(() => button("Add workout plan").click());
    act(() => sheetButton("Upper").click());
    expect(sheet().querySelectorAll('[aria-labelledby="plan-suggested"] button')).toHaveLength(16);
  });

  it("refuses a blank name, and a name you already have", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] });
    act(() => button("Add workout plan").click());
    saveSheet();
    expect(sheet().querySelector("#plan-name-error").textContent).toBe("Enter a plan name");
    act(() => sheetButton("Push").click());
    saveSheet();
    expect(sheet().querySelector("#plan-name-error").textContent).toBe(
      "You already have Push day. Pick another name, or edit that one.",
    );
    expect(gymActions.savePlan).not.toHaveBeenCalled();
  });

  it("edits a plan: reorder, new exercise, and keeps one removed from your list", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] });
    act(() => button("Edit").click());
    // No name suggestions when editing.
    expect(sheet().querySelector('[aria-label="Name suggestions"]')).toBe(null);
    // Cable fly isn't built in or in customLifts: it stays, marked.
    expect(sheet().textContent).toContain("Cable fly · removed from your list");
    act(() => sheet().querySelector('[aria-label="Move Overhead press up"]').click());
    act(() => sheetButton("Other…").click());
    typeInto(sheet().querySelector('[aria-label="New exercise"]'), "  dips ");
    act(() => sheetButton("Add").click());
    expect(gymActions.addExercise).toHaveBeenCalledWith("dips");
    saveSheet();
    expect(gymActions.savePlan).toHaveBeenCalledWith({
      id: "p1",
      name: "Push day",
      exercises: ["Overhead press", "Bench press", "Cable fly", "dips"],
    });
  });

  it("refuses a blank new exercise", () => {
    renderGym();
    act(() => button("Add workout plan").click());
    act(() => sheetButton("Other…").click());
    act(() => sheetButton("Add").click());
    expect(sheet().textContent).toContain("Enter an exercise name");
    expect(gymActions.addExercise).not.toHaveBeenCalled();
  });

  it("✕ removes one of your own exercises from your list, never a built-in", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, customLifts: ["Pec fly"], plans: [push] });
    act(() => button("Edit").click());
    act(() => sheetButton("Other…").click());
    const removes = sheet().querySelectorAll(".plan-chip-remove");
    expect(removes).toHaveLength(1);
    expect(removes[0].getAttribute("aria-label")).toBe("Remove Pec fly from your list. Its sets and plans stay.");
    act(() => removes[0].click());
    expect(gymActions.forgetLift).toHaveBeenCalledWith("Pec fly");
    // Removing doesn't change the plan being edited.
    saveSheet();
    expect(gymActions.savePlan.mock.calls[0][0].exercises).toEqual(push.exercises);
  });

  it("deletes a plan only after confirming", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] });
    act(() => button("Edit").click());
    act(() => sheetButton("Delete plan").click());
    expect(sheet().textContent).toContain("Delete Push day? Your logged sets stay.");
    expect(gymActions.deletePlan).not.toHaveBeenCalled();
    act(() => sheetButton("Delete").click());
    expect(gymActions.deletePlan).toHaveBeenCalledWith("p1");
  });

  it("closes the sheet on Escape without saving", () => {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] });
    act(() => button("Edit").click());
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(sheet()).toBe(null);
    expect(gymActions.savePlan).not.toHaveBeenCalled();
  });
});

describe("Doing a workout", () => {
  const push = { id: "p1", name: "Push day", exercises: ["Bench press", "Overhead press"] };
  const logs = [
    { id: "a", date: "2026-10-27", lift: "Bench press", weight: 150, reps: 5 },
    { id: "b", date: "2026-10-28", lift: "Bench press", weight: 155, reps: 5 },
    { id: "c", date: "2026-10-28", lift: "Bench press", weight: 160, reps: 3 },
  ];
  const withPlan = { ...gym, logs, plans: [push] };
  const exerciseButton = (start) =>
    [...container.querySelectorAll(".plan-exercise")].find((b) => b.textContent.startsWith(start));
  const weightInput = () => container.querySelectorAll(".gym-log input[type=number]")[0];

  beforeEach(() => gymActions.addLog.mockClear());

  it("Start gym session asks which plan, then starts it", () => {
    const actions = renderGym(IDLE_SESSION, timerActions(), withPlan);
    act(() => button("Start gym session").click());
    const chooser = document.querySelector(".plan-chooser");
    expect([...chooser.querySelectorAll(".plan-chooser-list button")].map((b) => b.textContent)).toEqual([
      "Push day",
      "No plan",
    ]);
    act(() => [...chooser.querySelectorAll("button")].find((b) => b.textContent === "Push day").click());
    expect(actions.startSession).toHaveBeenCalledWith("p1");
    expect(document.querySelector(".plan-chooser")).toBe(null);
  });

  it("a plan card's Start skips the chooser and stays on Workout", () => {
    const actions = renderGym(IDLE_SESSION, timerActions(), withPlan);
    act(() => button("Start").click());
    expect(actions.startSession).toHaveBeenCalledWith("p1");
    expect(tab("Workout").getAttribute("aria-selected")).toBe("true");
  });

  it("logs from the plan's exercise buttons with the last weight filled in", () => {
    const actions = renderGym(startSession(IDLE_SESSION, 0, "p1"), timerActions(), withPlan);
    expect(container.textContent).toContain("Push day · session on");
    expect(exerciseButton("Bench press").textContent).toBe("Bench press · 2 sets");
    expect(exerciseButton("Bench press").getAttribute("aria-pressed")).toBe("true");
    expect(weightInput().value).toBe("160");
    expect(container.querySelector(".lift-field")).toBe(null);
    act(() => exerciseButton("Overhead press").click());
    expect(weightInput().value).toBe("");
    act(() => exerciseButton("Bench press").click());
    typeInto(container.querySelectorAll(".gym-log input[type=number]")[1], "5");
    act(() => container.querySelector(".log-form").dispatchEvent(new Event("submit", { bubbles: true })));
    expect(gymActions.addLog).toHaveBeenCalledWith({ lift: "Bench press", weight: "160", reps: "5" });
    expect(actions.afterSet).toHaveBeenCalled();
    act(() => exerciseButton("Other exercise").click());
    expect(container.querySelector(".lift-field")).not.toBe(null);
  });

  it("a session whose plan was deleted carries on as No plan", () => {
    renderGym(startSession(IDLE_SESSION, 0, "gone"), timerActions(), withPlan);
    expect(container.querySelector(".plan-exercise")).toBe(null);
    expect(container.querySelector(".lift-field")).not.toBe(null);
  });

  it("End session shows how many sets were logged", () => {
    const onToast = vi.fn();
    const session = { ...startSession(IDLE_SESSION, 0, "p1"), setsLogged: 9 };
    const actions = renderGym(session, timerActions(), withPlan, onToast);
    act(() => button("End session").click());
    expect(onToast).toHaveBeenCalledWith("Push day done — 9 sets");
    expect(actions.endSession).toHaveBeenCalled();
  });

  it("End session with no sets shows no message", () => {
    const onToast = vi.fn();
    renderGym(startSession(IDLE_SESSION, 0), timerActions(), withPlan, onToast);
    act(() => button("End session").click());
    expect(onToast).not.toHaveBeenCalled();
  });
});

describe("Week strip", () => {
  it("shows the plan name", () => {
    act(() =>
      root.render(
        <RestTimer compact title="Push day" session={startTimer(IDLE_SESSION, 0)} left={72} actions={timerActions()} />,
      ),
    );
    expect(container.querySelector(".rest-timer--compact").textContent).toContain("Push day ·1:12");
  });
});

describe("Add to calendar", () => {
  const push = { id: "p1", name: "Push day", exercises: [] };
  function openSheet(onToast, onAddEvent) {
    renderGym(IDLE_SESSION, timerActions(), { ...gym, plans: [push] }, onToast, onAddEvent);
    act(() => button("Add to calendar").click());
    return document.querySelector(".calendar-sheet");
  }
  const sheetButton = (sheet, text) => [...sheet.querySelectorAll("button")].find((b) => b.textContent.trim() === text);

  it("adds a one-off block to the Day calendar, defaulting to today at 6 PM for an hour", () => {
    const onToast = vi.fn();
    const onAddEvent = vi.fn();
    const sheet = openSheet(onToast, onAddEvent);
    act(() => sheetButton(sheet, "Add to Day calendar").click());
    expect(onAddEvent).toHaveBeenCalledWith({
      date: "2026-10-28",
      start: 1080,
      length: 60,
      title: "Push day",
      repeat: undefined,
    });
    expect(onToast).toHaveBeenCalledWith("Push day added to Wed, Oct 28");
    expect(document.querySelector(".calendar-sheet")).not.toBe(null);
  });

  it("adds a weekly block when Repeat every week is ticked", () => {
    const onToast = vi.fn();
    const onAddEvent = vi.fn();
    const sheet = openSheet(onToast, onAddEvent);
    act(() => sheet.querySelector('input[type="checkbox"]').click());
    act(() => sheetButton(sheet, "Add to Day calendar").click());
    expect(onAddEvent.mock.calls[0][0].repeat).toBe("weekly");
    expect(onToast).toHaveBeenCalledWith("Push day added to Wed, Oct 28, every week");
    act(() => sheetButton(sheet, "Close").click());
    expect(document.querySelector(".calendar-sheet")).toBe(null);
  });
});

