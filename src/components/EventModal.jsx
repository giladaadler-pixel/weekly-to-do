import { useEffect, useState } from "react";
import { DAY_MINUTES, formatLength, formatTime12 } from "../lib/schedule.js";

// New event: title, start and length, opened from a tapped slot on the day page.
// With `event` set, shows that event instead, with a Delete button.
// onSave({ start, length, title }), onDelete(), onCancel()
export default function EventModal({ event, start: initialStart = 540, onSave, onDelete, onCancel }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(initialStart);
  const [length, setLength] = useState(60);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (event) {
    return (
      <div className="modal-backdrop" onClick={onCancel}>
        <div className="modal event-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={event.title}>
          <h2>{event.title}</h2>
          <p className="mono muted">
            {formatTime12(event.start)} – {formatTime12(event.start + event.length)} · {formatLength(event.length)}
          </p>
          <div className="modal-buttons">
            <button type="button" className="delete-button" onClick={onDelete}>
              Delete
            </button>
            <button type="button" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ start, length, title });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal event-modal" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="New event">
        <h2>New event</h2>
        <label className="form-field">
          <span>What</span>
          <input
            className="text-input"
            type="text"
            placeholder="e.g. Gym — push day"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </label>
        <div className="stepper-row">
          <div className="form-field">
            <span id="start-label">Start</span>
            <div className="stepper" role="group" aria-labelledby="start-label">
              <button type="button" onClick={() => setStart((s) => Math.max(0, s - 15))} aria-label="Earlier">
                −
              </button>
              <output className="mono">{formatTime12(start)}</output>
              <button type="button" onClick={() => setStart((s) => Math.min(DAY_MINUTES - 15, s + 15))} aria-label="Later">
                +
              </button>
            </div>
          </div>
          <div className="form-field">
            <span id="length-label">Length</span>
            <div className="stepper" role="group" aria-labelledby="length-label">
              <button type="button" onClick={() => setLength((l) => Math.max(15, l - 15))} aria-label="Shorter">
                −
              </button>
              <output className="mono">{formatLength(length)}</output>
              <button type="button" onClick={() => setLength((l) => Math.min(720, l + 15))} aria-label="Longer">
                +
              </button>
            </div>
          </div>
        </div>
        <span className="mono muted small-text">
          {formatTime12(start)} → {formatTime12(Math.min(start + length, DAY_MINUTES))}
        </span>
        <div className="modal-buttons">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="accent-button" disabled={!title.trim()}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
