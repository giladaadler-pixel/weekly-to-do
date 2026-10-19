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
        onPhoneOpen={() => {}}
        onPhoneClose={() => {}}
        onExport={() => {}}
        onImport={() => {}}
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
const menuButton = () => container.querySelector(".menu-button");
const backdrop = () => container.querySelector(".sidebar-backdrop");

// React's mouseenter/mouseleave are built from mouseover/mouseout.
function hover() {
  act(() => sidebar().dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body })));
}
function unhover() {
  act(() => sidebar().dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })));
}
function pressEscape() {
  act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
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

  it("lists Today first, then Week and Accomplishments", () => {
    render();
    const labels = [...container.querySelectorAll("nav .sidebar-page")].map((b) => b.textContent);
    expect(labels).toEqual(["📅Today", "🗓Week", "🏆Accomplishments"]);
  });

  it("marks the current page", () => {
    render({ page: "accomplishments" });
    expect(pageButton("Accomplishments").getAttribute("aria-current")).toBe("page");
    expect(pageButton("Week").getAttribute("aria-current")).toBeNull();
  });

  it("has no ✕ button", () => {
    render({ pinned: true });
    expect(container.querySelector(".sidebar-close")).toBeNull();
    expect(container.textContent).not.toContain("✕");
  });

  it("puts ☰ first, above the page icons", () => {
    render();
    const buttons = [...sidebar().querySelectorAll("button")];
    expect(buttons[0]).toBe(menuButton());
  });

  it("☰ pins it when tucked", () => {
    const onPin = vi.fn();
    const onTuck = vi.fn();
    render({ onPin, onTuck });
    expect(menuButton().getAttribute("aria-expanded")).toBe("false");
    expect(menuButton().getAttribute("aria-label")).toBe("Open sidebar");
    act(() => menuButton().click());
    expect(onPin).toHaveBeenCalledOnce();
    expect(onTuck).not.toHaveBeenCalled();
  });

  it("☰ pins it while peeking", () => {
    const onPin = vi.fn();
    render({ onPin });
    hover();
    act(() => menuButton().click());
    expect(onPin).toHaveBeenCalledOnce();
  });

  it("☰ tucks it when pinned, without pinning again", () => {
    const onPin = vi.fn();
    const onTuck = vi.fn();
    render({ pinned: true, onPin, onTuck });
    expect(menuButton().getAttribute("aria-expanded")).toBe("true");
    expect(menuButton().getAttribute("aria-label")).toBe("Close sidebar");
    act(() => menuButton().click());
    expect(onTuck).toHaveBeenCalledOnce();
    expect(onPin).not.toHaveBeenCalled();
  });

  it("has no backdrop", () => {
    render({ pinned: true });
    expect(backdrop()).toBeNull();
  });
});

describe("Sidebar backup tools", () => {
  const tool = (name) => [...container.querySelectorAll(".sidebar-tool")].find((b) => b.textContent.includes(name));
  const fileInput = () => container.querySelector("input[type='file']");

  it("shows Export and Import below the pages", () => {
    render();
    expect(tool("Export backup")).toBeTruthy();
    expect(tool("Import backup")).toBeTruthy();
    expect(container.querySelector(".sidebar-divider")).not.toBeNull();
  });

  it("Export calls onExport", () => {
    const onExport = vi.fn();
    render({ onExport });
    act(() => tool("Export backup").click());
    expect(onExport).toHaveBeenCalledOnce();
  });

  it("Import opens the file picker, and a picked file goes to onImport", () => {
    const onImport = vi.fn();
    render({ onImport });
    const pick = vi.spyOn(fileInput(), "click");
    act(() => tool("Import backup").click());
    expect(pick).toHaveBeenCalledOnce();
    const file = new File(["{}"], "backup.json", { type: "application/json" });
    Object.defineProperty(fileInput(), "files", { value: [file], configurable: true });
    act(() => fileInput().dispatchEvent(new Event("change", { bubbles: true })));
    expect(onImport).toHaveBeenCalledWith(file);
  });

  it("on a phone, picking a tool closes the sidebar", () => {
    const onPhoneClose = vi.fn();
    const onExport = vi.fn();
    render({ isPhone: true, phoneOpen: true, onPhoneClose, onExport });
    act(() => tool("Export backup").click());
    expect(onExport).toHaveBeenCalledOnce();
    expect(onPhoneClose).toHaveBeenCalledOnce();
    act(() => tool("Import backup").click());
    expect(onPhoneClose).toHaveBeenCalledTimes(2);
  });
});

describe("Sidebar on a phone", () => {
  it("is hidden until opened", () => {
    render({ isPhone: true });
    expect(sidebar().classList.contains("open")).toBe(false);
    act(() =>
      root.render(
        <Sidebar page="week" onPage={() => {}} isPhone phoneOpen onPhoneOpen={() => {}} onPhoneClose={() => {}} />
      )
    );
    expect(sidebar().classList.contains("open")).toBe(true);
  });

  it("☰ opens it when closed", () => {
    const onPhoneOpen = vi.fn();
    const onPhoneClose = vi.fn();
    render({ isPhone: true, onPhoneOpen, onPhoneClose });
    expect(menuButton().getAttribute("aria-expanded")).toBe("false");
    expect(menuButton().getAttribute("aria-label")).toBe("Open sidebar");
    act(() => menuButton().click());
    expect(onPhoneOpen).toHaveBeenCalledOnce();
    expect(onPhoneClose).not.toHaveBeenCalled();
  });

  it("☰ closes it when open", () => {
    const onPhoneOpen = vi.fn();
    const onPhoneClose = vi.fn();
    render({ isPhone: true, phoneOpen: true, onPhoneOpen, onPhoneClose });
    expect(menuButton().getAttribute("aria-expanded")).toBe("true");
    expect(menuButton().getAttribute("aria-label")).toBe("Close sidebar");
    act(() => menuButton().click());
    expect(onPhoneClose).toHaveBeenCalledOnce();
    expect(onPhoneOpen).not.toHaveBeenCalled();
  });

  it("☰ never pins on a phone", () => {
    const onPin = vi.fn();
    render({ isPhone: true, onPin });
    act(() => menuButton().click());
    expect(onPin).not.toHaveBeenCalled();
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

  it("shows a backdrop only while open, and tapping it closes", () => {
    const onPhoneClose = vi.fn();
    render({ isPhone: true, onPhoneClose });
    expect(backdrop()).toBeNull();
    act(() =>
      root.render(
        <Sidebar page="week" onPage={() => {}} isPhone phoneOpen onPhoneOpen={() => {}} onPhoneClose={onPhoneClose} />
      )
    );
    act(() => backdrop().click());
    expect(onPhoneClose).toHaveBeenCalledOnce();
  });

  it("Escape closes it when open", () => {
    const onPhoneClose = vi.fn();
    render({ isPhone: true, phoneOpen: true, onPhoneClose });
    pressEscape();
    expect(onPhoneClose).toHaveBeenCalledOnce();
  });

  it("Escape does nothing when closed", () => {
    const onPhoneClose = vi.fn();
    render({ isPhone: true, onPhoneClose });
    pressEscape();
    expect(onPhoneClose).not.toHaveBeenCalled();
  });
});
