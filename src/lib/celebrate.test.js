import { describe, it, expect, vi, afterEach } from "vitest";
import { celebrate } from "./celebrate.js";

function fakeWindow(reduceMotion) {
  return {
    document,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    matchMedia: () => ({ matches: reduceMotion }),
  };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("celebrate", () => {
  it("shows a 🎉 burst that removes itself", () => {
    vi.useFakeTimers();
    const button = document.createElement("button");
    document.body.append(button);
    celebrate(button, fakeWindow(false));
    const burst = document.querySelector(".celebration");
    expect(burst.textContent).toContain("🎉");
    vi.advanceTimersByTime(1200);
    expect(document.querySelector(".celebration")).toBeNull();
  });

  it("does nothing when reduced motion is on", () => {
    const button = document.createElement("button");
    document.body.append(button);
    celebrate(button, fakeWindow(true));
    expect(document.querySelector(".celebration")).toBeNull();
  });
});
