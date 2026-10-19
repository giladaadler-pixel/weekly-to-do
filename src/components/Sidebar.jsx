import { useEffect, useState } from "react";

// Every page in the sidebar, in order. A new page is one more line here.
export const PAGES = [
  { id: "week", icon: "🗓", label: "Week" },
  { id: "accomplishments", icon: "🏆", label: "Accomplishments" },
];

// Laptop: a thin icon strip on the left ("tucked"), with ☰ at the top. Hovering slides
// it open over the page ("peek"); clicking anywhere on it keeps it open ("pinned", saved
// by the parent). ☰ toggles between pinned and tucked.
// Phone: hidden until ☰ opens it (phoneOpen). ☰ again, the backdrop, Escape or picking
// a page closes it.
export default function Sidebar({
  page,
  onPage,
  pinned,
  onPin,
  onTuck,
  isPhone,
  phoneOpen,
  onPhoneOpen,
  onPhoneClose,
}) {
  const [peek, setPeek] = useState(false);
  const expanded = isPhone ? phoneOpen : pinned;

  useEffect(() => {
    if (!isPhone || !phoneOpen) return;
    const onKey = (event) => event.key === "Escape" && onPhoneClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPhone, phoneOpen, onPhoneClose]);

  let mode;
  if (isPhone) mode = phoneOpen ? "phone open" : "phone";
  else mode = pinned ? "pinned" : peek ? "peek" : "tucked";

  function pickPage(id) {
    onPage(id);
    if (isPhone) onPhoneClose();
  }

  // ☰ handles itself, so the click mustn't also reach the "click anywhere pins" handler.
  function toggle(event) {
    event.stopPropagation();
    if (isPhone) {
      if (phoneOpen) onPhoneClose();
      else onPhoneOpen();
    } else if (pinned) {
      setPeek(false);
      onTuck();
    } else {
      onPin();
    }
  }

  // ☰ sits outside the sliding panel so it stays put in the top-left corner while the
  // panel slides in and out on phones.
  return (
    <aside
      className={`sidebar ${mode}`}
      aria-label="Sidebar"
      onMouseEnter={() => !isPhone && setPeek(true)}
      onMouseLeave={() => setPeek(false)}
      onClick={() => !isPhone && !pinned && onPin()}
    >
      <button
        className="menu-button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? "Close sidebar" : "Open sidebar"}
      >
        ☰
      </button>
      {isPhone && phoneOpen && <div className="sidebar-backdrop" onClick={onPhoneClose} />}
      <div className="sidebar-panel">
        <nav className="sidebar-pages">
          {PAGES.map((p) => (
            <button
              key={p.id}
              className="sidebar-page"
              aria-current={page === p.id ? "page" : undefined}
              onClick={() => pickPage(p.id)}
              title={p.label}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {p.icon}
              </span>
              <span className="sidebar-label">{p.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
