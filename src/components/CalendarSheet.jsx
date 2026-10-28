import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dayLabel, formatShort } from "../lib/dates.js";
import { buildWorkoutIcs, workoutFileName } from "../lib/ics.js";
import { downloadFile } from "../lib/download.js";

// "Add to calendar" for a workout plan: a block on the app's Day calendar and/or a
// phone-calendar file, once or every week. Stays open so both can be used.
// onAddEvent({ date, start, length, title, repeat }), onToast(message)
export default function CalendarSheet({ plan, todayIso, onAddEvent, onToast, onClose }) {
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState("18:00");
  const [length, setLength] = useState("60");
  const [weekly, setWeekly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // { date, start, length } from the fields, or null (with a message) if one is missing.
  function fields() {
    const [h, m] = time.split(":").map(Number);
    const len = Math.round(Number(length));
    if (!date || !time || !Number.isFinite(h) || !(len >= 15)) {
      setError("Pick a date, a start time and at least 15 minutes.");
      return null;
    }
    setError("");
    return { date, start: h * 60 + m, length: len };
  }

  function addToDay() {
    const f = fields();
    if (!f) return;
    onAddEvent({ ...f, title: plan.name, repeat: weekly ? "weekly" : undefined });
    onToast(`${plan.name} added to ${dayLabel(f.date)}, ${formatShort(f.date)}${weekly ? ", every week" : ""}`);
  }

  function sendToPhone() {
    const f = fields();
    if (!f) return;
    const ics = buildWorkoutIcs({ ...f, title: plan.name, weekly, uid: `${crypto.randomUUID()}@weekly-to-do` });
    downloadFile(ics, workoutFileName(plan.name), "text/calendar");
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal calendar-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Add ${plan.name} to calendar`}
      >
        <h2>Add {plan.name} to calendar</h2>
        <div className="calendar-fields">
          <label className="form-field">
            <span>Date</span>
            <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Start</span>
            <input className="text-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Minutes</span>
            <input
              className="text-input"
              type="number"
              inputMode="numeric"
              min="15"
              step="15"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </label>
        </div>
        <label className="calendar-repeat">
          <input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
          Repeat every week
        </label>
        {error && (
          <span className="field-error" role="alert">
            {error}
          </span>
        )}
        <div className="calendar-actions">
          <button type="button" className="accent-button" onClick={addToDay}>
            Add to Day calendar
          </button>
          <button type="button" className="ghost-button bordered" onClick={sendToPhone}>
            Send to phone calendar
          </button>
        </div>
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
