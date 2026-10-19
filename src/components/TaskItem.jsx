import { useState } from "react";
import TaskSheet from "./TaskSheet.jsx";

const PRIORITY_NAMES = { high: "High", medium: "Medium", low: "Low" };

// A compact row: [checkbox] [priority dot] text. Tapping the text opens the TaskSheet
// to edit, move or delete it.
// deleteChoices (for repeats): [{ label, onClick }] the sheet shows instead of deleting right away.
export default function TaskItem({ task, actions, label, mark, deleteChoices, draggable = false }) {
  const [open, setOpen] = useState(false);

  function onTextKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <li
      className={task.done ? "task done" : "task"}
      draggable={draggable && !open}
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
      <span
        className={`priority-dot priority-dot-${task.priority}`}
        role="img"
        aria-label={`${PRIORITY_NAMES[task.priority]} priority`}
      />
      {/* A span, not a <button>, so dragging the row by its text still works in every browser. */}
      <span className="task-text" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={onTextKey}>
        {task.done && <span className="check">✓ </span>}
        {mark && <span className="task-mark">{mark} </span>}
        {task.text}
        {label && <span className="task-label"> ({label})</span>}
      </span>
      {open && (
        <TaskSheet task={task} actions={actions} deleteChoices={deleteChoices} onClose={() => setOpen(false)} />
      )}
    </li>
  );
}
