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
        onPage={() => {}}
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

describe("TopBar Today button", () => {
  it("is hidden on the current week", () => {
    render({ isCurrentWeek: true });
    expect(todayButton()).toBeNull();
  });

  it("shows on another week and calls onToday when clicked", () => {
    const onToday = vi.fn();
    render({ isCurrentWeek: false, onToday });
    expect(todayButton().textContent).toBe("Today");
    act(() => todayButton().click());
    expect(onToday).toHaveBeenCalledOnce();
  });
});
