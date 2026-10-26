import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "./App.jsx";
import { STORAGE_KEY } from "./lib/storage.js";
import { TOAST_MS } from "./components/Toast.jsx";

vi.mock("./lib/download.js", () => ({ downloadFile: vi.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const tool = (name) => [...container.querySelectorAll(".sidebar-tool")].find((b) => b.title === name);
const toast = () => document.body.querySelector(".toast[role='status']");

async function importText(text) {
  const input = container.querySelector("input[type='file']");
  // jsdom's File has no text(), so hand over a file-like object instead.
  const file = { name: "backup.json", text: async () => text };
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
}

describe("backup toasts", () => {
  it("says Backup downloaded after exporting, then closes itself", () => {
    vi.useFakeTimers();
    act(() => tool("Export backup").click());
    expect(toast().textContent).toBe("Backup downloaded");
    act(() => vi.advanceTimersByTime(TOAST_MS - 1));
    expect(toast()).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(toast()).toBeNull();
  });

  it("says Backup restored after a confirmed import", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await importText(JSON.stringify({ tasks: [{ id: "t1", text: "From backup", date: "2026-10-27", done: false, priority: "low" }] }));
    expect(window.confirm).toHaveBeenCalledOnce();
    expect(toast().textContent).toBe("Backup restored");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).tasks[0].text).toBe("From backup");
  });

  it("shows no toast and keeps the data when the import isn't confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await importText(JSON.stringify({ tasks: [] }));
    expect(toast()).toBeNull();
  });

  it("says a bad file isn't a backup in the toast, not an alert", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const confirm = vi.spyOn(window, "confirm");
    await importText("not json");
    expect(toast().textContent).toBe("That file isn't a Weekly To-Do backup");
    expect(alert).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe("starting page", () => {
  const current = () => container.querySelector("nav .sidebar-page[aria-current='page']");

  it("opens on Week, showing the current week", () => {
    expect(current().textContent).toBe("Week");
    expect(container.querySelector(".week-page")).not.toBeNull();
    expect(container.querySelector(".today-button")).toBeNull(); // only shown away from the current week
  });

  it("opens on Week on a phone-sized screen too", () => {
    act(() => root.unmount());
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    root = createRoot(container);
    act(() => root.render(<App />));
    expect(current().textContent).toBe("Week");
    expect(container.querySelector(".week-page")).not.toBeNull();
  });
});
