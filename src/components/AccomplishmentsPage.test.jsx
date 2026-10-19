import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import AccomplishmentsPage from "./AccomplishmentsPage.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<AccomplishmentsPage goals={[]} onMarkNotDone={() => {}} {...props} />));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const rows = () => [...container.querySelectorAll(".accomplishment")];

describe("AccomplishmentsPage", () => {
  it("shows the empty message when nothing is done", () => {
    render({ goals: [{ id: "a", title: "Open", done: false, style: "checklist", items: [] }] });
    expect(container.textContent).toContain("No accomplishments yet. Finish a goal and it'll show up here.");
    expect(rows()).toHaveLength(0);
  });

  it("lists only done goals, newest first, with notes and dates", () => {
    const oct15 = new Date(2026, 9, 15, 9).getTime();
    const oct2 = new Date(2026, 9, 2, 9).getTime();
    render({
      goals: [
        { id: "old", title: "Old", done: true, completedAt: oct2, style: "paragraph", text: "", items: [] },
        { id: "open", title: "Open", done: false, style: "paragraph", text: "", items: [] },
        { id: "new", title: "New", done: true, completedAt: oct15, style: "bullets", items: [{ text: "a" }, { text: "b" }] },
        { id: "legacy", title: "Legacy", done: true, style: "checklist", items: [] },
      ],
    });
    expect(rows().map((r) => r.querySelector(".accomplishment-name").textContent)).toEqual(["New", "Old", "Legacy"]);
    expect(rows()[0].querySelector(".accomplishment-notes").textContent).toBe("a · b");
    expect(rows()[1].querySelector(".accomplishment-notes")).toBeNull();
    expect(rows()[0].querySelector(".accomplishment-date").textContent).toBe("Oct 15, 2026");
    expect(rows()[2].querySelector(".accomplishment-date").textContent).toBe("Completed");
  });

  it("has only a Mark not done button, which sends the goal back", () => {
    const onMarkNotDone = vi.fn();
    render({ goals: [{ id: "g", title: "Run", done: true, completedAt: 1, style: "paragraph", text: "x" }], onMarkNotDone });
    const buttons = rows()[0].querySelectorAll("button");
    expect([...buttons].map((b) => b.textContent)).toEqual(["Mark not done"]);
    act(() => buttons[0].click());
    expect(onMarkNotDone).toHaveBeenCalledWith("g");
  });
});

describe("AccomplishmentsPage notes", () => {
  it("shows 📝 N on a finished goal and opens its notes", () => {
    const onOpenNotes = vi.fn();
    render({
      goals: [
        { id: "g", title: "Run", done: true, completedAt: 1, style: "paragraph", text: "" },
        { id: "h", title: "Swim", done: true, completedAt: 2, style: "paragraph", text: "" },
      ],
      notes: [{ id: "n1", goalId: "g", text: "a", date: "2026-10-19" }],
      onOpenNotes,
    });
    const notesButtons = [...container.querySelectorAll(".goal-notes-link")];
    expect(notesButtons).toHaveLength(1);
    expect(notesButtons[0].textContent).toBe("📝 1");
    act(() => notesButtons[0].click());
    expect(onOpenNotes).toHaveBeenCalledWith("g");
  });
});
