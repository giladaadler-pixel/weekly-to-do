import { describe, it, expect, vi } from "vitest";
import { updateBadge } from "./badge.js";

function fakeNavigator() {
  return { setAppBadge: vi.fn(() => Promise.resolve()), clearAppBadge: vi.fn(() => Promise.resolve()) };
}

describe("updateBadge", () => {
  it("sets the badge to the count", () => {
    const nav = fakeNavigator();
    updateBadge(3, nav);
    expect(nav.setAppBadge).toHaveBeenCalledWith(3);
    expect(nav.clearAppBadge).not.toHaveBeenCalled();
  });

  it("clears the badge at 0", () => {
    const nav = fakeNavigator();
    updateBadge(0, nav);
    expect(nav.clearAppBadge).toHaveBeenCalledOnce();
    expect(nav.setAppBadge).not.toHaveBeenCalled();
  });

  it("does nothing when badges aren't supported", () => {
    expect(() => updateBadge(2, {})).not.toThrow();
    expect(() => updateBadge(2, undefined)).not.toThrow();
  });

  it("never throws, even when the browser call throws or rejects", async () => {
    const throwing = { setAppBadge: () => { throw new Error("nope"); }, clearAppBadge: () => { throw new Error("nope"); } };
    expect(() => updateBadge(1, throwing)).not.toThrow();
    expect(() => updateBadge(0, throwing)).not.toThrow();
    const rejecting = { setAppBadge: () => Promise.reject(new Error("denied")), clearAppBadge: () => Promise.reject(new Error("denied")) };
    expect(() => updateBadge(1, rejecting)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0)); // an unhandled rejection would fail the run
  });
});
