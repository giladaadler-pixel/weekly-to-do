import { describe, it, expect } from "vitest";
import { STORAGE_KEY, DEFAULT_STATE, loadState, saveState } from "./storage.js";

function fake(initial) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

describe("loadState", () => {
  it("returns the default state when nothing is saved", () => {
    expect(loadState(fake({}))).toEqual(DEFAULT_STATE);
  });

  it("returns the default state when saved data is broken", () => {
    expect(loadState(fake({ [STORAGE_KEY]: "not json" }))).toEqual(DEFAULT_STATE);
  });

  it("returns the default state when storage is blocked", () => {
    expect(
      loadState({
        getItem() {
          throw new Error("blocked");
        },
      })
    ).toEqual(DEFAULT_STATE);
  });
});

describe("saveState", () => {
  it("never throws, even when storage is full", () => {
    expect(() =>
      saveState(DEFAULT_STATE, {
        setItem() {
          throw new Error("full");
        },
      })
    ).not.toThrow();
  });

  it("round-trips through loadState", () => {
    const f = fake({});
    const s = {
      ...DEFAULT_STATE,
      tasks: [{ id: "1", text: "Gym", date: "2026-10-15", done: true, priority: "high" }],
    };
    saveState(s, f);
    expect(loadState(f)).toEqual(s);
  });
});

describe("theme", () => {
  it("round-trips a dark theme", () => {
    const f = fake({});
    saveState({ ...DEFAULT_STATE, theme: "dark" }, f);
    expect(loadState(f).theme).toBe("dark");
  });

  it("loads an old saved state without a theme as light", () => {
    const old = { tasks: [], repeats: [], goals: [] };
    expect(loadState(fake({ [STORAGE_KEY]: JSON.stringify(old) })).theme).toBe("light");
  });
});

describe("settings", () => {
  it("loads an old saved state without settings with an 8:00 reminder time", () => {
    const old = { tasks: [], repeats: [], goals: [], theme: "light" };
    expect(loadState(fake({ [STORAGE_KEY]: JSON.stringify(old) })).settings).toEqual({ reminderTime: "08:00" });
  });
});

describe("notes", () => {
  it("loads an old saved state without notes as an empty list", () => {
    const old = { tasks: [], repeats: [], goals: [], theme: "light" };
    expect(loadState(fake({ [STORAGE_KEY]: JSON.stringify(old) })).notes).toEqual([]);
  });
});

describe("sidebar pinned", () => {
  it("loads an old saved state without ui as not pinned", () => {
    const old = { tasks: [], repeats: [], goals: [], theme: "light" };
    expect(loadState(fake({ [STORAGE_KEY]: JSON.stringify(old) })).ui).toEqual({ sidebarPinned: false });
  });

  it("round-trips a pinned sidebar", () => {
    const f = fake({});
    saveState({ ...DEFAULT_STATE, ui: { sidebarPinned: true } }, f);
    expect(loadState(f).ui.sidebarPinned).toBe(true);
  });
});

describe("when the browser blocks localStorage itself", () => {
  it("still loads and saves without throwing", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });
    try {
      expect(loadState()).toEqual(DEFAULT_STATE);
      expect(() => saveState(DEFAULT_STATE)).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });
});
