import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import TopBar from "./TopBar.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TopBar
        page="week"
        viewWeek="2026-10-11"
        onPrev={() => {}}
        onNext={() => {}}
        onToday={() => {}}
        isCurrentWeek={true}
        stats={{ done: 0, total: 0 }}
        theme="light"
        onToggleTheme={() => {}}
        {...props}
      />
    )
  );
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const todayButton = () => container.querySelector("button[aria-label='Go to current week']");

describe("TopBar This week button", () => {
  it("is hidden on the current week", () => {
    render({ isCurrentWeek: true });
    expect(todayButton()).toBeNull();
  });

  it("shows on another week and calls onToday when clicked", () => {
    const onToday = vi.fn();
    render({ isCurrentWeek: false, onToday });
    expect(todayButton().textContent).toBe("This week");
    act(() => todayButton().click());
    expect(onToday).toHaveBeenCalledOnce();
  });
});

describe("TopBar on the Today page", () => {
  it("shows Today on the left, without week arrows or the week count", () => {
    render({ page: "today", stats: { done: 2, total: 5 } });
    expect(container.querySelector(".page-name").textContent).toBe("Today");
    expect(container.querySelector(".week-nav")).toBeNull();
    expect(container.querySelector(".stats")).toBeNull();
  });

  it("shows no page name on the Week page", () => {
    render({ page: "week" });
    expect(container.querySelector(".page-name")).toBeNull();
  });
});

describe("TopBar layout", () => {
  it("has no ☰ or ✕ button (☰ lives in the sidebar now)", () => {
    render();
    expect(container.querySelector(".menu-button")).toBeNull();
    expect(container.textContent).not.toContain("☰");
    expect(container.textContent).not.toContain("✕");
  });

  it("keeps the theme button last, at the far right", () => {
    render();
    const buttons = [...container.querySelectorAll(".top-bar > button")];
    expect(buttons.at(-1).className).toBe("theme-button");
  });

  it("no longer has the Week | Accomplishments switch", () => {
    render();
    expect(container.querySelector(".page-switch")).toBeNull();
  });
});
