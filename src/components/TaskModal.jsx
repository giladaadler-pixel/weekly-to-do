import { useEffect, useState } from "react";
import PrioritySelect from "./PrioritySelect.jsx";
import DayPicker from "./DayPicker.jsx";

// onCreate(text, priority, days). days: picked weekdays (0 = Sun …). Empty = a one-off task.
export default function TaskModal({ onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [days, setDays] = useState([]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function onSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title, priority, days);
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Create new task">
        <h2>Create new task</h2>
        <label className="field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" autoFocus />
        </label>
        <label className="field">
          Priority
          <PrioritySelect value={priority} onChange={setPriority} />
        </label>
        <div className="field">
          Repeat on
          <DayPicker days={days} onChange={setDays} />
        </div>
        <div className="modal-buttons">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary blue" disabled={!title.trim()}>
            Create task
          </button>
        </div>
      </form>
    </div>
  );
}
