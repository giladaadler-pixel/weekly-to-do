import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PrioritySelect from "./PrioritySelect.jsx";

// Edit pop-up for one task row, opened by tapping its text.
// The date field shows only for one-off tasks (they have a date); changing it moves the task.
// deleteChoices (for repeats): [{ label, onClick }] shown instead of deleting right away.
// Rendered into <body> so a done row's fade and strikethrough don't reach it.
export default function TaskSheet({ task, actions, deleteChoices, onClose }) {
  const [text, setText] = useState(task.text);
  const [priority, setPriority] = useState(task.priority);
  const [date, setDate] = useState(task.date ?? "");
  const [choosingDelete, setChoosingDelete] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onSubmit(e) {
    e.preventDefault();
    // Blank text keeps the old text.
    if (text.trim() && text.trim() !== task.text) actions.edit(task.id, text);
    if (priority !== task.priority) actions.setPriority(task.id, priority);
    if (task.date && date && date !== task.date) actions.move(task.id, date);
    onClose();
  }

  function onDelete() {
    if (deleteChoices) {
      setChoosingDelete(true);
      return;
    }
    actions.remove(task.id);
    onClose();
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Edit task"
      >
        <h2>Edit task</h2>
        <label className="field">
          Task
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Task" autoFocus />
        </label>
        <label className="field">
          Priority
          <PrioritySelect value={priority} onChange={setPriority} />
        </label>
        {task.date && (
          <label className="field">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          </label>
        )}
        {choosingDelete ? (
          <div className="delete-choices">
            <span>Delete which?</span>
            {deleteChoices.map((choice) => (
              <button
                type="button"
                key={choice.label}
                onClick={() => {
                  choice.onClick();
                  onClose();
                }}
              >
                {choice.label}
              </button>
            ))}
            <button type="button" onClick={() => setChoosingDelete(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <div className="modal-buttons">
            <button type="button" className="delete-button" onClick={onDelete}>
              Delete
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary blue">
              Save
            </button>
          </div>
        )}
      </form>
    </div>,
    document.body
  );
}
