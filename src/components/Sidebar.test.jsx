import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import Sidebar from "./Sidebar.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function render(props) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <Sidebar
        page="week"
        onPage={() => {}}
        pinned={false}
        onPin={() => {}}
        onTuck={() => {}}
        isPhone={false}
        phoneOpen={false}
        onPhoneClose={() => {}}
        {...props}
      />
    )
  );
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const sidebar = () => container.querySelector(".sidebar");
const pageButton = (name) =>
  [...container.querySelectorAll(".sidebar-page")].find((b) => b.textContent.includes(name));
const closeButton = () => container.querySelector("button[aria-label='Close sidebar']");

// React's mouseenter/mouseleave are built from mouseover/mouseout.
function hover() {
  act(() => sidebar().dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body })));
}
function unhover() {
  act(() => sidebar().dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })));
}

describe("Sidebar on a laptop", () => {
  it("starts tucked", () => {
    render();
    expect(sidebar().classList.contains("tucked")).toBe(true);
  });

  it("peeks while hovered and tucks again when the mouse leaves", () => {
    render();
    hover();
    expect(sidebar().classList.contains("peek")).toBe(true);
    unhover();
    expect(sidebar().classList.contains("tucked")).toBe(true);
  });

  it("pins when clicked anywhere on it", () => {
    const onPin = vi.fn();
    render({ onPin });
    act(() => sidebar().click());
    expect(onPin).toHaveBeenCalledOnce();
  });

  it("pins and switches page when a page is clicked", () => {
    const onPin = vi.fn();
    const onPage = vi.fn();
    render({ onPin, onPage });
    act(() => pageButton("Accomplishments").click());
    expect(onPage).toHaveBeenCalledWith("accomplishments");
    expect(onPin).toHaveBeenCalledOnce();
  });

  it("stays open when pinned, even after the mouse leaves", () => {
    render({ pinned: true });
    hover();
    unhover();
    expect(sidebar().classList.contains("pinned")).toBe(true);
  });

  it("✕ tucks it without pinning", () => {
    const onPin = vi.fn();
    const onTuck = vi.fn();
    render({ pinned: true, onPin, onTuck });
    act(() => closeButton().click());
    expect(onTuck).toHaveBeenCalledOnce();
    expect(onPin).not.toHaveBeenCalled();
  });

  it("marks the current page", () => {
    render({ page: "accomplishments" });
    expect(pageButton("Accomplishments").getAttribute("aria-current")).toBe("page");
    expect(pageButton("Week").getAttribute("aria-current")).toBeNull();
  });
});

describe("Sidebar on a phone", () => {
  it("is hidden until opened", () => {
    render({ isPhone: true });
    expect(sidebar().classList.contains("open")).toBe(false);
    act(() => root.render(<Sidebar page="week" onPage={() => {}} isPhone phoneOpen onPhoneClose={() => {}} />));
    expect(sidebar().classList.contains("open")).toBe(true);
  });

  it("closes after picking a page, without pinning", () => {
    const onPage = vi.fn();
    const onPin = vi.fn();
    const onPhoneClose = vi.fn();
    render({ isPhone: true, phoneOpen: true, onPage, onPin, onPhoneClose });
    act(() => pageButton("Accomplishments").click());
    expect(onPage).toHaveBeenCalledWith("accomplishments");
    expect(onPhoneClose).toHaveBeenCalledOnce();
    expect(onPin).not.toHaveBeenCalled();
  });

  it("does not peek on hover", () => {
    render({ isPhone: true });
    hover();
    expect(sidebar().classList.contains("peek")).toBe(false);
  });

  it("✕ closes it", () => {
    const onPhoneClose = vi.fn();
    render({ isPhone: true, phoneOpen: true, onPhoneClose });
    act(() => closeButton().click());
    expect(onPhoneClose).toHaveBeenCalledOnce();
  });
});
