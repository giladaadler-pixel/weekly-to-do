import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import DayColumn from "./DayColumn.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let restore = [];

const noop = () => {};
const taskActions = { add: noop, toggle: noop, setPriority: noop, edit: noop, move: noop, remove: noop };
const repeatActions = { toggle: noop, setPriority: noop, edit: noop, deleteOne: noop, deleteFuture: noop, makeUp: noop, clearAll: noop };
const DATE = "2026-10-28";
const task = (id, done = false) => ({ id, text: `Task ${id}`, date: DATE, done, priority: "low" });

// jsdom has no layout. Fake it: the box has `available` px of room, and its content is as
// tall as contentAt(density) says. Each list row is 30px.
function fakeLayout({ available, contentAt }) {
  const proto = HTMLElement.prototype;
  const saved = {
    offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
    clientHeight: Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight"),
    rect: Element.prototype.getBoundingClientRect,
  };
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get() {
      return this.classList.contains("day-body-inner") ? contentAt(this.closest(".day").dataset.density) : 0;
    },
  });
  Object.defineProperty(Element.prototype, "clientHeight", {
    configurable: true,
    get() {
      return this.classList.contains("day-body") ? available : 0;
    },
  });
  Element.prototype.getBoundingClientRect = function () {
    if (this.tagName === "LI") {
      const index = [...this.parentElement.children].indexOf(this);
      return { top: index * 30, bottom: index * 30 + 30, left: 0, right: 0, width: 0, height: 30 };
    }
    return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  };
  restore.push(() => {
    Object.defineProperty(proto, "offsetHeight", saved.offsetHeight);
    Object.defineProperty(Element.prototype, "clientHeight", saved.clientHeight);
    Element.prototype.getBoundingClientRect = saved.rect;
  });
}

function render(tasks, onOpenDay = vi.fn()) {
  act(() =>
    root.render(
      <DayColumn
        date={DATE}
        isToday={false}
        tasks={tasks}
        repeats={[]}
        overdue={[]}
        taskActions={taskActions}
        repeatActions={repeatActions}
        onOpenDay={onOpenDay}
      />
    )
  );
  return onOpenDay;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  restore.forEach((r) => r());
  restore = [];
});

const box = () => container.querySelector(".day");
const texts = () => [...container.querySelectorAll(".task-text")].map((t) => t.textContent);
const foldButton = () => container.querySelector(".fold-button");

describe("DayColumn fitting", () => {
  it("stays roomy when everything fits", () => {
    fakeLayout({ available: 300, contentAt: () => 100 });
    render([task("a"), task("b", true)]);
    expect(box().dataset.density).toBe("normal");
    expect(foldButton()).toBeNull();
  });

  it("goes compact when that's enough", () => {
    fakeLayout({ available: 300, contentAt: (d) => (d === "normal" ? 340 : 280) });
    render([task("a"), task("b", true)]);
    expect(box().dataset.density).toBe("compact");
    expect(foldButton()).toBeNull();
  });

  it("at tight, folds finished tasks into ✓ N done, and clicking it shows them again", () => {
    // Only fits once tight, whether the done tasks are folded or shown.
    fakeLayout({ available: 300, contentAt: (d) => (d === "tight" ? 250 : 400) });
    const onOpenDay = render([task("a"), task("b", true), task("c"), task("d", true)]);
    expect(box().dataset.density).toBe("tight");
    expect(texts()).toEqual(["Task a", "Task c"]);
    expect(foldButton().textContent).toBe("✓ 2 done");
    act(() => foldButton().click());
    expect(onOpenDay).not.toHaveBeenCalled();
    expect(box().dataset.density).toBe("tight");
    expect(foldButton()).toBeNull();
    expect(texts()).toEqual(["Task a", "Task c", "Task b", "Task d"]); // done tasks sort last
  });

  it("as a last resort shows only the rows that fit and +N more, which opens the day", () => {
    // 100px of room: 3 rows of 30px fit. Never fits, even tight.
    fakeLayout({ available: 100, contentAt: () => 500 });
    const onOpenDay = render([task("a"), task("b"), task("c"), task("d"), task("e"), task("f", true)]);
    expect(box().dataset.density).toBe("tight");
    expect(box().hasAttribute("data-clipped")).toBe(true);
    expect(texts()).toEqual(["Task a", "Task b", "Task c"]);
    // d and e, plus the folded done task.
    const more = container.querySelector(".more-button");
    expect(more.textContent).toBe("+3 more");
    act(() => more.click());
    expect(onOpenDay).toHaveBeenCalledWith(DATE);
  });
});
