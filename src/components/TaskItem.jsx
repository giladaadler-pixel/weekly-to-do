import { useState } from "react";
import PrioritySelect from "./PrioritySelect.jsx";

// deleteChoices (for repeats): [{ label, onClick }] shown instead of deleting right away.
export default function TaskItem({ task, actions, label, mark, deleteChoices, draggable = false }) {
  const [editing, setEditing] = useState(false);
  const [choosingDelete, setChoosingDelete] = useState(false);
  const [draft, setDraft] = useState(task.text);

  function startEdit() {
    setDraft(task.text);
    setEditing(true);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      actions.edit(task.id, draft);
      setEditing(false);
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  }

  return (
    <li
      className={task.done ? "task done" : "task"}
      draggable={draggable && !editing}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => actions.toggle(task.id, e.target.checked)}
        aria-label={`Done: ${task.text}`}
      />
      {editing ? (
        <input
          className="task-edit"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setEditing(false)}
        />
      ) : (
        <span className="task-text">
          {task.done && <span className="check">✓ </span>}
          {mark && <span className="task-mark">{mark} </span>}
          {task.text}
          {label && <span className="task-label"> ({label})</span>}
        </span>
      )}
      <PrioritySelect
        className="priority-tag"
        value={task.priority}
        onChange={(priority) => actions.setPriority(task.id, priority)}
      />
      <button className="icon-button" onClick={startEdit} aria-label="Edit">
        ✏️
      </button>
      <button
        className="icon-button"
        onClick={() => (deleteChoices ? setChoosingDelete(true) : actions.remove(task.id))}
        aria-label="Delete"
      >
        🗑
      </button>
      {choosingDelete && (
        <div className="delete-choices">
          {deleteChoices.map((choice) => (
            <button
              key={choice.label}
              onClick={() => {
                setChoosingDelete(false);
                choice.onClick();
              }}
            >
              {choice.label}
            </button>
          ))}
          <button onClick={() => setChoosingDelete(false)}>Cancel</button>
        </div>
      )}
    </li>
  );
}
