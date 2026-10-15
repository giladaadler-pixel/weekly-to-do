import { useState } from "react";
import PrioritySelect from "./PrioritySelect.jsx";

export default function TaskItem({ task, actions }) {
  const [editing, setEditing] = useState(false);
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
    <li className={task.done ? "task done" : "task"}>
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
          {task.text}
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
      <button className="icon-button" onClick={() => actions.remove(task.id)} aria-label="Delete">
        🗑
      </button>
    </li>
  );
}
