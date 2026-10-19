import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { buildReminderIcs } from "../lib/ics.js";
import { downloadFile } from "../lib/download.js";

export const APP_URL = "https://giladaadler-pixel.github.io/weekly-to-do/";
// iOS 17+ opens this scheme in Safari, even from the home-screen app.
const SAFARI_URL = `x-safari-${APP_URL}`;

// "Add to calendar" downloads a daily repeating calendar event at the chosen time.
// onSave(time) keeps the time in settings. standalone: running as the home-screen app on
// iPhone, where the download may not reach Calendar, so it also offers to use Safari.
export default function ReminderModal({ time, todayIso, standalone, onSave, onClose }) {
  const [value, setValue] = useState(time);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function add(e) {
    e.preventDefault();
    if (!value) return;
    onSave(value);
    const ics = buildReminderIcs({ time: value, url: APP_URL, todayIso, uid: `${crypto.randomUUID()}@weekly-to-do` });
    downloadFile(ics, "weekly-to-do-reminder.ics", "text/calendar");
    if (standalone) setAdded(true);
    else onClose();
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onSubmit={add} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Daily reminder">
        <h2>Daily reminder</h2>
        <p className="modal-note">Adds a repeating event to your calendar that reminds you to check your list.</p>
        <label className="field">
          Time
          <input type="time" value={value} onChange={(e) => setValue(e.target.value)} required />
        </label>
        {added ? (
          <>
            <p className="modal-note">
              If nothing happened, open the site in Safari and add the reminder from there.{" "}
              <a className="open-in-safari" href={SAFARI_URL}>
                Open in Safari
              </a>
            </p>
            <div className="modal-buttons">
              <button type="button" className="primary blue" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary blue" disabled={!value}>
              Add to calendar
            </button>
          </div>
        )}
      </form>
    </div>,
    document.body
  );
}
