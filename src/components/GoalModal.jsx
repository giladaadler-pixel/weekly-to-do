import { useEffect, useState } from "react";
import { convertStyle, resolveDueDate } from "../lib/goals.js";
import PrioritySelect from "./PrioritySelect.jsx";
import StyleSelect from "./StyleSelect.jsx";
import DayPicker from "./DayPicker.jsx";

function ItemsEditor({ items, onChange }) {
  function setText(i, text) {
    onChange(items.map((item, j) => (j === i ? { ...item, text } : item)));
  }
  return (
    <div className="items-editor">
      {items.map((item, i) => (
        <div key={i} className="items-editor-row">
          <input value={item.text} onChange={(e) => setText(i, e.target.value)} aria-label={`Item ${i + 1}`} />
          <button type="button" className="icon-button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove item">
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { text: "", done: false }])}>
        + Add item
      </button>
    </div>
  );
}

export default function GoalModal({ todayIso, onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState({ style: "checklist", items: [], text: "" });
  const [priority, setPriority] = useState("medium");
  const [doneBy, setDoneBy] = useState("none");
  const [pickedDate, setPickedDate] = useState("");
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
    onCreate({ title, ...description, priority, dueDate: resolveDueDate(doneBy, todayIso, pickedDate), days });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Create new goal">
        <h2>Create new goal</h2>
        <label className="field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <div className="field">
          <div className="field-row">
            Description
            <StyleSelect value={description.style} onChange={(style) => setDescription((d) => convertStyle(d, style))} />
          </div>
          {description.style === "paragraph" ? (
            <textarea
              rows={4}
              value={description.text}
              onChange={(e) => setDescription((d) => ({ ...d, text: e.target.value }))}
              aria-label="Description"
            />
          ) : (
            <ItemsEditor items={description.items} onChange={(items) => setDescription((d) => ({ ...d, items }))} />
          )}
        </div>
        <label className="field">
          Priority
          <PrioritySelect value={priority} onChange={setPriority} />
        </label>
        <label className="field">
          Done by
          <select value={doneBy} onChange={(e) => setDoneBy(e.target.value)}>
            <option value="none">No deadline</option>
            <option value="week">End of this week</option>
            <option value="month">End of this month</option>
            <option value="date">Pick a date…</option>
          </select>
        </label>
        {doneBy === "date" && (
          <input type="date" value={pickedDate} min={todayIso} onChange={(e) => setPickedDate(e.target.value)} aria-label="Due date" />
        )}
        <div className="field">
          Show on days
          <DayPicker days={days} onChange={setDays} />
        </div>
        <div className="modal-buttons">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!title.trim()}>
            Create goal
          </button>
        </div>
      </form>
    </div>
  );
}
