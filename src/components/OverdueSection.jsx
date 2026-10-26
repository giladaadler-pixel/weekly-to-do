import { useState } from "react";
import { overdueLabel } from "../lib/tasks.js";
import { missedDates } from "../lib/repeats.js";
import TaskSheet from "./TaskSheet.jsx";

// "Carried over" box: overdue one-off tasks and missed repeats. Each row is
// [checkbox] text [amber label] [Skip].
export default function OverdueSection({ tasks, repeats, todayIso, taskActions, repeatActions }) {
  const missed = repeats
    .map((repeat) => ({ repeat, count: missedDates(repeat, todayIso).length }))
    .filter((m) => m.count > 0);

  if (tasks.length === 0 && missed.length === 0) return null;
  return (
    <div className="overdue">
      <h3 className="overdue-heading">
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        Carried over · {tasks.length + missed.length}
      </h3>
      <ul className="task-list">
        {tasks.map((task) => (
          <OverdueTask key={task.id} task={task} todayIso={todayIso} taskActions={taskActions} />
        ))}
        {missed.map(({ repeat, count }) => (
          <li key={repeat.id} className="task overdue-row">
            <input
              type="checkbox"
              checked={false}
              onChange={() => repeatActions.makeUp(repeat.id)}
              aria-label={`Make up one: ${repeat.text}`}
            />
            <span className="task-text">
              <span className="task-mark">{repeat.goalId ? "🎯" : "🔁"} </span>
              {repeat.text}
            </span>
            <span className="overdue-tag">{count}×</span>
            <button
              className="overdue-skip"
              onClick={() => repeatActions.clearAll(repeat.id)}
              aria-label={`Skip overdue: ${repeat.text}`}
            >
              Skip
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Tapping the text still opens the TaskSheet to edit, move or delete it.
function OverdueTask({ task, todayIso, taskActions }) {
  const [open, setOpen] = useState(false);

  function onTextKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <li className="task overdue-row">
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => taskActions.toggle(task.id, e.target.checked)}
        aria-label={`Done: ${task.text}`}
      />
      <span className="task-text" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={onTextKey}>
        {task.text}
      </span>
      <span className="overdue-tag">{overdueLabel(task.date, todayIso)}</span>
      <button
        className="overdue-skip"
        onClick={() => taskActions.move(task.id, todayIso)}
        aria-label={`Skip overdue: ${task.text}`}
      >
        Skip
      </button>
      {open && <TaskSheet task={task} actions={taskActions} onClose={() => setOpen(false)} />}
    </li>
  );
}
