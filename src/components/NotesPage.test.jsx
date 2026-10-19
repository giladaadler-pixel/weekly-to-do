import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import NotesPage from "./NotesPage.jsx";
import { makeNote, editNote, deleteNote } from "../lib/notes.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TODAY = "2026-10-19";

let container;
let root;

const run = {
  id: "g1",
  title: "Run a 10k",
  priority: "high",
  dueDate: "2026-12-01",
  style: "checklist",
  items: [
    { text: "Buy shoes", done: true },
    { text: "Run 5k", done: false },
  ],
  done: false,
};
const read = { id: "g2", title: "Read 12 books", priority: "low", style: "paragraph", text: "", items: [], done: false };
const old = { id: "g3", title: "Learn to juggle", priority: "medium", style: "bullets", items: [], done: true };

// Holds real notes and the selection, like App does.
function Harness({ goals, initialNotes, initialSelected, isPhone }) {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState(initialSelected);
  const noteActions = {
    add: (text, goalId) => {
      const note = makeNote(text, goalId, TODAY);
      if (note) setNotes((ns) => [...ns, note]);
    },
    edit: (id, text) => setNotes((ns) => editNote(ns, id, text)),
    remove: (id) => setNotes((ns) => deleteNote(ns, id)),
  };
  return (
    <NotesPage
      goals={goals}
      notes={notes}
      todayIso={TODAY}
      selected={selected}
      onSelect={setSelected}
      noteActions={noteActions}
      isPhone={isPhone}
    />
  );
}

function render({ goals = [run, read, old], notes = [], selected = null, isPhone = false } = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(<Harness goals={goals} initialNotes={notes} initialSelected={selected} isPhone={isPhone} />)
  );
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const panelTitle = () => container.querySelector(".notes-panel-title")?.textContent;
const box = () => container.querySelector("textarea[aria-label='Write a note']");
const noteTexts = () => [...container.querySelectorAll(".note-text")].map((e) => e.textContent);
const item = (name) => [...container.querySelectorAll(".notes-item")].find((b) => b.textContent.includes(name));
const button = (name) => [...container.querySelectorAll("button")].find((b) => b.textContent === name);

function type(textarea, value) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  act(() => {
    setValue.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function pressEnter(textarea, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key: "Enter", shiftKey, bubbles: true, cancelable: true });
  act(() => textarea.dispatchEvent(event));
  return event;
}

describe("NotesPage list", () => {
  it("selects the first active goal by default", () => {
    render();
    expect(panelTitle()).toBe("Run a 10k");
    expect(item("Run a 10k").getAttribute("aria-current")).toBe("true");
  });

  it("shows each goal's note count", () => {
    render({ notes: [makeNote("a", "g1", TODAY), makeNote("b", "g1", TODAY)] });
    expect(item("Run a 10k").textContent).toContain("2");
  });

  it("keeps finished goals in a collapsed Finished group", () => {
    render();
    expect(item("Learn to juggle")).toBeUndefined();
    act(() => button("Finished (1)").click());
    expect(item("Learn to juggle")).toBeTruthy();
  });

  it("switching goals shows that goal's notes", () => {
    render({ notes: [makeNote("Ran 5k", "g1", TODAY), makeNote("Chapter 3", "g2", TODAY)] });
    expect(noteTexts()).toEqual(["Ran 5k"]);
    act(() => item("Read 12 books").click());
    expect(panelTitle()).toBe("Read 12 books");
    expect(noteTexts()).toEqual(["Chapter 3"]);
  });
});

describe("NotesPage panel", () => {
  it("shows the due date and checklist progress", () => {
    render();
    const panel = container.querySelector(".notes-panel");
    expect(panel.textContent).toContain("Due Dec 1");
    expect(panel.textContent).toContain("1 of 2 steps");
    expect(panel.querySelector("[role='progressbar']").getAttribute("aria-valuenow")).toBe("1");
  });

  it("has no progress bar for a goal that isn't a checklist", () => {
    render({ selected: "g2" });
    expect(container.querySelector("[role='progressbar']")).toBeNull();
  });

  it("shows the empty state", () => {
    render();
    expect(container.textContent).toContain("No notes yet. Write your first one above.");
  });

  it("Enter adds a note on top, dated today, and clears the box", () => {
    render({ notes: [{ id: "x", goalId: "g1", text: "Older", date: "2026-10-12" }] });
    type(box(), "Ran 5k");
    const event = pressEnter(box());
    expect(event.defaultPrevented).toBe(true);
    expect(noteTexts()).toEqual(["Ran 5k", "Older"]);
    expect(container.querySelector(".note-date").textContent).toBe("Oct 19");
    expect(box().value).toBe("");
  });

  it("the Save button adds a note", () => {
    render();
    type(box(), "Bought shoes");
    act(() => button("Save").click());
    expect(noteTexts()).toEqual(["Bought shoes"]);
  });

  it("Shift+Enter makes a new line instead of saving", () => {
    render();
    type(box(), "Line one");
    const event = pressEnter(box(), true);
    expect(event.defaultPrevented).toBe(false);
    expect(noteTexts()).toEqual([]);
  });

  it("blank text does nothing", () => {
    render();
    type(box(), "   ");
    pressEnter(box());
    expect(noteTexts()).toEqual([]);
  });

  it("clicking a note edits it in place", () => {
    render({ notes: [{ id: "n1", goalId: "g1", text: "Ran 5k", date: TODAY }] });
    act(() => container.querySelector(".note-text").click());
    const edit = container.querySelector("textarea[aria-label='Edit note']");
    expect(edit.value).toBe("Ran 5k");
    type(edit, "Ran 6k");
    act(() => [...container.querySelectorAll(".note button")].find((b) => b.textContent === "Save").click());
    expect(noteTexts()).toEqual(["Ran 6k"]);
  });

  it("Cancel leaves a note unchanged", () => {
    render({ notes: [{ id: "n1", goalId: "g1", text: "Ran 5k", date: TODAY }] });
    act(() => container.querySelector(".note-text").click());
    type(container.querySelector("textarea[aria-label='Edit note']"), "Changed");
    act(() => button("Cancel").click());
    expect(noteTexts()).toEqual(["Ran 5k"]);
  });

  it("deleting asks first; Cancel keeps it and Delete removes it", () => {
    render({ notes: [{ id: "n1", goalId: "g1", text: "Ran 5k", date: TODAY }] });
    act(() => container.querySelector("button[aria-label='Delete note']").click());
    expect(container.textContent).toContain("Delete this note?");
    act(() => button("Cancel").click());
    expect(noteTexts()).toEqual(["Ran 5k"]);
    act(() => container.querySelector("button[aria-label='Delete note']").click());
    act(() => button("Delete").click());
    expect(noteTexts()).toEqual([]);
  });
});

describe("NotesPage general notes", () => {
  it("shows and adds general notes", () => {
    render({ notes: [makeNote("Goal note", "g1", TODAY), makeNote("Idea", null, TODAY)] });
    act(() => item("General notes").click());
    expect(panelTitle()).toBe("General notes");
    expect(noteTexts()).toEqual(["Idea"]);
    type(box(), "Another idea");
    pressEnter(box());
    expect(noteTexts()).toEqual(["Another idea", "Idea"]);
  });

  it("with no goals, shows General notes and invites you to make a goal", () => {
    render({ goals: [] });
    expect(panelTitle()).toBe("General notes");
    expect(container.textContent).toContain("No goals yet");
  });
});

describe("NotesPage on a phone", () => {
  it("shows only the list until an item is picked", () => {
    render({ isPhone: true });
    expect(container.querySelector(".notes-panel")).toBeNull();
    act(() => item("Read 12 books").click());
    expect(panelTitle()).toBe("Read 12 books");
    expect(container.querySelector(".notes-list")).toBeNull();
  });

  it("← Notes goes back to the list", () => {
    render({ isPhone: true, selected: "g1" });
    act(() => button("← Notes").click());
    expect(container.querySelector(".notes-list")).not.toBeNull();
    expect(container.querySelector(".notes-panel")).toBeNull();
  });
});
