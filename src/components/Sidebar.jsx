import { useEffect, useRef, useState } from "react";

// Every page in the sidebar, in order. A new page is one more line here.
export const PAGES = [
  { id: "today", icon: "📅", label: "Today" },
  { id: "week", icon: "🗓", label: "Week" },
  { id: "accomplishments", icon: "🏆", label: "Accomplishments" },
  { id: "notes", icon: "📝", label: "Notes" },
];

// Below a divider: daily reminder, Enable badge, and backup. onImport(file) gets the picked
// file. badgePermission: "unsupported" | "default" | "granted" | "denied".
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
  onExport,
  onImport,
  onReminder,
  onEnableBadge,
  badgePermission,
}) {
  const [peek, setPeek] = useState(false);
  const fileInput = useRef(null);
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

  // Like picking a page, a tool closes the phone sidebar.
  function pickTool(run) {
    run();
    if (isPhone) onPhoneClose();
  }

  function onFilePicked(e) {
    const [file] = e.target.files;
    if (file) onImport(file);
    // Let the same file be picked again later.
    e.target.value = "";
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
        <hr className="sidebar-divider" />
        <div className="sidebar-pages sidebar-tools">
          <button className="sidebar-page sidebar-tool" onClick={() => pickTool(onReminder)} title="Daily reminder">
            <span className="sidebar-icon" aria-hidden="true">
              ⏰
            </span>
            <span className="sidebar-label">Daily reminder</span>
          </button>
          {(badgePermission === "default" || badgePermission === "denied") && (
            <button className="sidebar-page sidebar-tool" onClick={() => pickTool(onEnableBadge)} title="Enable badge">
              <span className="sidebar-icon" aria-hidden="true">
                🔔
              </span>
              <span className="sidebar-label">Enable badge</span>
            </button>
          )}
          {badgePermission === "denied" && (
            <p className="sidebar-note sidebar-label">
              Notifications are blocked. Turn them on in Settings → Notifications → To-Do.
            </p>
          )}
          <button className="sidebar-page sidebar-tool" onClick={() => pickTool(onExport)} title="Export backup">
            <span className="sidebar-icon" aria-hidden="true">
              ⬇️
            </span>
            <span className="sidebar-label">Export backup</span>
          </button>
          <button
            className="sidebar-page sidebar-tool"
            onClick={() => pickTool(() => fileInput.current.click())}
            title="Import backup"
          >
            <span className="sidebar-icon" aria-hidden="true">
              ⬆️
            </span>
            <span className="sidebar-label">Import backup</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onFilePicked}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </aside>
  );
}
