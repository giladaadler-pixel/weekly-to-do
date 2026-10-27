import { useState } from "react";
import TaskSheet from "./TaskSheet.jsx";
import PriorityDot from "./PriorityDot.jsx";
import { confetti } from "../lib/clickFx.js";

// A compact row: [checkbox] [priority dot] text. The checkbox area ticks it; anywhere
// else on the row opens the TaskSheet to edit, move or delete it.
// deleteChoices (for repeats): [{ label, onClick }] the sheet shows instead of deleting right away.
export default function TaskItem({ task, actions, label, mark, deleteChoices, draggable = false }) {
  const [open, setOpen] = useState(false);
  // Plays the tick "pop" only when ticked here, not for tasks that load already done.
  const [pop, setPop] = useState(false);

  function onTextKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  // Clicks inside the checkbox, or inside the sheet (a portal, so its events still bubble
  // here through React), mustn't also open the sheet.
  function onRowClick(e) {
    if (!e.currentTarget.contains(e.target) || e.target.closest(".check-box")) return;
    setOpen(true);
  }

  return (
    <li
      className={task.done ? "task done" : "task"}
      draggable={draggable && !open}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onRowClick}
    >
      <label className="check-box">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => {
            setPop(e.target.checked);
            if (e.target.checked) confetti(e.target.nextElementSibling);
            actions.toggle(task.id, e.target.checked);
          }}
          aria-label={`Done: ${task.text}`}
        />
        <span className={pop ? "check-box-face pop" : "check-box-face"} aria-hidden="true" onAnimationEnd={() => setPop(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </label>
      <PriorityDot priority={task.priority} />
      {/* A span, not a <button>, so dragging the row by its text still works in every browser. */}
      <span className="task-text" role="button" tabIndex={0} onKeyDown={onTextKey}>
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
