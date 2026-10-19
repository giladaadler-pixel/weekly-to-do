import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ReminderModal from "./ReminderModal.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let downloads;

beforeEach(() => {
  downloads = [];
  URL.createObjectURL = vi.fn((blob) => {
    downloads.push({ blob });
    return "blob:reminder";
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
    downloads.at(-1).fileName = this.download;
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <ReminderModal time="08:00" todayIso="2026-10-19" standalone={false} onSave={() => {}} onClose={() => {}} {...props} />
    )
  );
}

const timeInput = () => document.body.querySelector("input[type='time']");
const button = (name) => [...document.body.querySelectorAll(".modal button")].find((b) => b.textContent === name);

// The test DOM's Blob has no .text(), so read it the older way.
function readBlob(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

function setTime(value) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  act(() => {
    setValue.call(timeInput(), value);
    timeInput().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("ReminderModal", () => {
  it("shows the title, explanation and the saved time", () => {
    render({ time: "07:15" });
    const modal = document.body.querySelector(".modal");
    expect(modal.querySelector("h2").textContent).toBe("Daily reminder");
    expect(modal.textContent).toContain("Adds a repeating event to your calendar that reminds you to check your list.");
    expect(timeInput().value).toBe("07:15");
  });

  it("Add to calendar saves the time and downloads the .ics file", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render({ onSave, onClose });
    setTime("21:30");
    act(() => button("Add to calendar").click());
    expect(onSave).toHaveBeenCalledWith("21:30");
    expect(downloads).toHaveLength(1);
    expect(downloads[0].fileName).toBe("weekly-to-do-reminder.ics");
    expect(downloads[0].blob.type).toBe("text/calendar");
    const text = await readBlob(downloads[0].blob);
    expect(text).toContain("DTSTART:20261019T213000");
    expect(text).toContain("RRULE:FREQ=DAILY");
    expect(text).toContain("URL:https://giladaadler-pixel.github.io/weekly-to-do/");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Cancel closes without saving or downloading", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render({ onSave, onClose });
    setTime("09:00");
    act(() => button("Cancel").click());
    expect(onSave).not.toHaveBeenCalled();
    expect(downloads).toHaveLength(0);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("in the installed iPhone app, also offers to open the site in Safari", () => {
    const onClose = vi.fn();
    render({ standalone: true, onClose });
    act(() => button("Add to calendar").click());
    expect(downloads).toHaveLength(1);
    expect(onClose).not.toHaveBeenCalled();
    const modal = document.body.querySelector(".modal");
    expect(modal.textContent).toContain("If nothing happened, open the site in Safari and add the reminder from there.");
    expect(modal.querySelector("a.open-in-safari").getAttribute("href")).toBe(
      "x-safari-https://giladaadler-pixel.github.io/weekly-to-do/"
    );
    act(() => button("Done").click());
    expect(onClose).toHaveBeenCalledOnce();
  });
});
