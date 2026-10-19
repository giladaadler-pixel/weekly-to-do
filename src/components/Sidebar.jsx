import { useState } from "react";

// Every page in the sidebar, in order. A new page is one more line here.
export const PAGES = [
  { id: "week", icon: "🗓", label: "Week" },
  { id: "accomplishments", icon: "🏆", label: "Accomplishments" },
];

// Laptop: a thin icon strip on the right ("tucked"). Hovering slides it open over the
// page ("peek"); clicking anywhere on it keeps it open ("pinned", saved by the parent).
// ✕ tucks it again.
// Phone: hidden until ☰ opens it (phoneOpen); ✕ or picking a page closes it.
export default function Sidebar({ page, onPage, pinned, onPin, onTuck, isPhone, phoneOpen, onPhoneClose }) {
  const [peek, setPeek] = useState(false);

  let mode;
  if (isPhone) mode = phoneOpen ? "phone open" : "phone";
  else mode = pinned ? "pinned" : peek ? "peek" : "tucked";

  function pickPage(id) {
    onPage(id);
    if (isPhone) onPhoneClose();
  }

  function close(event) {
    event.stopPropagation();
    if (isPhone) {
      onPhoneClose();
    } else {
      setPeek(false);
      onTuck();
    }
  }

  return (
    <aside
      className={`sidebar ${mode}`}
      aria-label="Sidebar"
      onMouseEnter={() => !isPhone && setPeek(true)}
      onMouseLeave={() => setPeek(false)}
      onClick={() => !isPhone && !pinned && onPin()}
    >
      <button className="sidebar-close" onClick={close} aria-label="Close sidebar">
        ✕
      </button>
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
    </aside>
  );
}
