import { describe, it, expect } from "vitest";
import { makeNote, editNote, deleteNote, notesFor, countFor } from "./notes.js";

const TODAY = "2026-10-19";

describe("makeNote", () => {
  it("makes a dated note for a goal", () => {
    const note = makeNote("  Ran 5k  ", "g1", TODAY);
    expect(note).toEqual({ id: expect.any(String), goalId: "g1", text: "Ran 5k", date: TODAY });
  });

  it("makes a general note with a null goalId", () => {
    expect(makeNote("Idea", null, TODAY).goalId).toBeNull();
  });

  it("returns null for blank text", () => {
    expect(makeNote("   ", "g1", TODAY)).toBeNull();
  });

  it("keeps line breaks inside the text", () => {
    expect(makeNote("one\ntwo", "g1", TODAY).text).toBe("one\ntwo");
  });
});

describe("editNote", () => {
  const notes = [{ id: "n1", goalId: "g1", text: "Old", date: TODAY }];

  it("changes the text", () => {
    expect(editNote(notes, "n1", " New ")[0].text).toBe("New");
  });

  it("keeps the old text when the new text is blank", () => {
    expect(editNote(notes, "n1", "  ")).toEqual(notes);
  });
});

describe("deleteNote", () => {
  it("removes only that note", () => {
    const notes = [{ id: "n1" }, { id: "n2" }];
    expect(deleteNote(notes, "n1")).toEqual([{ id: "n2" }]);
  });
});

describe("notesFor and countFor", () => {
  const notes = [
    { id: "a", goalId: "g1", text: "a", date: "2026-10-17" },
    { id: "b", goalId: "g1", text: "b", date: "2026-10-19" },
    { id: "c", goalId: "g2", text: "c", date: "2026-10-19" },
    { id: "d", goalId: "g1", text: "d", date: "2026-10-19" },
    { id: "e", goalId: null, text: "e", date: "2026-10-18" },
  ];

  it("gives a goal's notes newest first, later-added first on the same day", () => {
    expect(notesFor(notes, "g1").map((n) => n.id)).toEqual(["d", "b", "a"]);
  });

  it("gives general notes for null", () => {
    expect(notesFor(notes, null).map((n) => n.id)).toEqual(["e"]);
  });

  it("counts a goal's notes", () => {
    expect(countFor(notes, "g1")).toBe(3);
    expect(countFor(notes, "g9")).toBe(0);
  });
});
