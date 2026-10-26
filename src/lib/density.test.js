import { describe, it, expect } from "vitest";
import { nextDensity } from "./density.js";

describe("nextDensity", () => {
  it("stays roomy when everything fits", () => {
    expect(nextDensity({ level: "normal", contentHeight: 200, available: 300 })).toBe("normal");
    expect(nextDensity({ level: "normal", contentHeight: 300, available: 300 })).toBe("normal");
  });

  it("steps one level tighter at a time while the content overflows", () => {
    expect(nextDensity({ level: "normal", contentHeight: 301, available: 300 })).toBe("compact");
    expect(nextDensity({ level: "compact", contentHeight: 320, available: 300 })).toBe("tight");
    expect(nextDensity({ level: "tight", contentHeight: 320, available: 300 })).toBe("clipped");
  });

  it("stays clipped when even that overflows: there's nothing tighter", () => {
    expect(nextDensity({ level: "clipped", contentHeight: 900, available: 300, roomierHeight: 900 })).toBe("clipped");
  });

  it("moves back up only when the roomier level fits with 8px to spare", () => {
    expect(nextDensity({ level: "compact", contentHeight: 250, available: 300, roomierHeight: 292 })).toBe("normal");
    expect(nextDensity({ level: "compact", contentHeight: 250, available: 300, roomierHeight: 293 })).toBe("compact");
    expect(nextDensity({ level: "clipped", contentHeight: 280, available: 300, roomierHeight: 293 })).toBe("clipped");
    expect(nextDensity({ level: "clipped", contentHeight: 280, available: 300, roomierHeight: 280 })).toBe("tight");
  });

  it("doesn't move up without a measured roomier height", () => {
    expect(nextDensity({ level: "tight", contentHeight: 100, available: 300 })).toBe("tight");
  });
});
