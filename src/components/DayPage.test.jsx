// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import DayPage, { HOUR_PX } from "./DayPage.jsx";
import DayColumn from "./DayColumn.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const noop = () => {};
const taskActions = { add: vi.fn(), toggle: noop, setPriority: noop, edit: noop, move: noop, remove: noop };
const repeatActions = { toggle: noop, setPriority: noop, edit: noop, deleteOne: noop, deleteFuture: noop, makeUp: noop, clearAll: noop };

function mount(el) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(el));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderDay(props = {}) {
  const eventActions = { add: vi.fn(), remove: vi.fn() };
  mount(
    <DayPage
      date="2026-10-28"
      todayIso="2026-10-27"
      tasks={[]}
      repeats={[]}
      events={[{ id: "e1", date: "2026-10-28", start: 600, length: 90, title: "Gym" }]}
      taskActions={taskActions}
      repeatActions={repeatActions}
      eventActions={eventActions}
      onDate={noop}
      onBack={noop}
      {...props}
    />
  );
  return eventActions;
}

describe("DayPage calendar", () => {
  it("shows all 24 hours", () => {
    renderDay();
    expect(container.querySelectorAll(".cal-hour")).toHaveLength(24);
    const labels = [...container.querySelectorAll(".cal-hour-label")].map((l) => l.textContent);
    expect(labels[9]).toBe("9 AM");
    expect(labels[23]).toBe("11 PM");
  });

  it("places an event by its start and length", () => {
    renderDay();
    const ev = container.querySelector(".cal-event");
    expect(ev.textContent).toContain("Gym");
    expect(ev.textContent).toContain("10:00 AM – 11:30 AM");
    expect(ev.style.top).toBe(`${10 * HOUR_PX + 1}px`);
    expect(ev.style.height).toBe(`${1.5 * HOUR_PX - 2}px`);
  });

  it("tapping an empty spot opens a new event at that half hour and saves it", () => {
    const eventActions = renderDay();
    const grid = container.querySelector(".cal-grid");
    grid.getBoundingClientRect = () => ({ top: 0, left: 0 });
    act(() => grid.dispatchEvent(new MouseEvent("click", { bubbles: true, clientY: 14.6 * HOUR_PX })));
    const dialog = document.querySelector("[role='dialog'][aria-label='New event']");
    expect(dialog.textContent).toContain("2:30 PM");
    const input = dialog.querySelector("input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    act(() => {
      setter.call(input, "Study");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => dialog.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(eventActions.add).toHaveBeenCalledWith({ date: "2026-10-28", start: 870, length: 60, title: "Study" });
  });

  it("tapping an event lets you delete it", () => {
    const eventActions = renderDay();
    act(() => container.querySelector(".cal-event").click());
    const del = document.querySelector(".event-modal .delete-button");
    act(() => del.click());
    expect(eventActions.remove).toHaveBeenCalledWith("e1");
  });

  it("shows the red now line only on today", () => {
    renderDay();
    expect(container.querySelector(".cal-now")).toBeNull();
    act(() => root.unmount());
    container.remove();
    renderDay({ date: "2026-10-27" });
    expect(container.querySelector(".cal-now")).not.toBeNull();
  });
});

describe("Week day box", () => {
  function renderColumn(onOpenDay) {
    mount(
      <div className="week">
        <DayColumn
          date="2026-10-28"
          isToday={false}
          tasks={[{ id: "t1", text: "Read", date: "2026-10-28", done: false, priority: "low" }]}
          repeats={[]}
          overdue={[]}
          taskActions={taskActions}
          repeatActions={repeatActions}
          onOpenDay={onOpenDay}
        />
      </div>
    );
  }

  it("opens the day calendar when the box is tapped", () => {
    const onOpenDay = vi.fn();
    renderColumn(onOpenDay);
    act(() => container.querySelector(".day-body").click());
    expect(onOpenDay).toHaveBeenCalledWith("2026-10-28");
  });

  it("doesn't open the day when a task or the add button is tapped", () => {
    const onOpenDay = vi.fn();
    renderColumn(onOpenDay);
    act(() => container.querySelector(".task").click());
    act(() => container.querySelector(".create-task").click());
    expect(onOpenDay).not.toHaveBeenCalled();
  });
});
