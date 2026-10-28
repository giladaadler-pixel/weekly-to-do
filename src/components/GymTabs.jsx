import { useRef } from "react";

// The last Gym tab you used. Its own key, apart from the main saved data.
export const TAB_KEY = "weekly-to-do:gym-tab";

export function loadTab(ids, storage) {
  try {
    storage ??= window.localStorage;
    const saved = storage.getItem(TAB_KEY);
    return ids.includes(saved) ? saved : ids[0];
  } catch {
    return ids[0];
  }
}

export function saveTab(id, storage) {
  try {
    storage ??= window.localStorage;
    storage.setItem(TAB_KEY, id);
  } catch {
    // Storage blocked: the page just opens on the first tab next time.
  }
}

// A row of pill tabs. Arrow keys, Home and End move between them.
// tabs: [{ id, label }]. Each panel uses id `gym-panel-<id>`, labelled by `gym-tab-<id>`.
export default function GymTabs({ tabs, current, onChange }) {
  const refs = useRef({});

  function onKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === current);
    const next = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="gym-tabs" role="tablist" aria-label="Gym sections" onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => (refs.current[t.id] = el)}
          type="button"
          role="tab"
          id={`gym-tab-${t.id}`}
          className="gym-tab"
          aria-selected={t.id === current}
          aria-controls={`gym-panel-${t.id}`}
          tabIndex={t.id === current ? 0 : -1}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
