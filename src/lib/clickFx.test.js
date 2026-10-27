import { describe, it, expect, vi, afterEach } from "vitest";
import { installClickFx, confetti } from "./clickFx.js";

function fakeWindow(reduceMotion) {
  return {
    document,
    Element,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    matchMedia: () => ({ matches: reduceMotion }),
  };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("click feedback", () => {
  it("bounces the clicked button and shows sparks that clean themselves up", () => {
    vi.useFakeTimers();
    const uninstall = installClickFx(fakeWindow(false));
    const button = document.createElement("button");
    document.body.append(button);
    button.click();
    expect(button.classList.contains("fx-bounce")).toBe(true);
    expect(document.querySelectorAll(".fx-burst .fx-spark").length).toBeGreaterThan(0);
    vi.advanceTimersByTime(700);
    expect(document.querySelector(".fx-burst")).toBeNull();
    uninstall();
  });

  it("ignores clicks on plain text", () => {
    const uninstall = installClickFx(fakeWindow(false));
    const p = document.createElement("p");
    document.body.append(p);
    p.click();
    expect(document.querySelector(".fx-burst")).toBeNull();
    uninstall();
  });

  it("does nothing when reduced motion is on", () => {
    const uninstall = installClickFx(fakeWindow(true));
    const button = document.createElement("button");
    document.body.append(button);
    button.click();
    confetti(button, fakeWindow(true));
    expect(button.classList.contains("fx-bounce")).toBe(false);
    expect(document.querySelector(".fx-burst, .fx-confetti")).toBeNull();
    uninstall();
  });

  it("throws confetti when asked", () => {
    const button = document.createElement("button");
    document.body.append(button);
    confetti(button, fakeWindow(false));
    expect(document.querySelectorAll(".fx-confetti-piece").length).toBe(16);
  });
});
