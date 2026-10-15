import { overdueLabel } from "../lib/tasks.js";
import { missedDates } from "../lib/repeats.js";
import TaskItem from "./TaskItem.jsx";

export default function OverdueSection({ tasks, repeats, todayIso, taskActions, repeatActions }) {
  const missed = repeats
    .map((repeat) => ({ repeat, count: missedDates(repeat, todayIso).length }))
    .filter((m) => m.count > 0);

  if (tasks.length === 0 && missed.length === 0) return null;
  return (
    <div className="overdue">
      <h3 className="overdue-heading">Overdue</h3>
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            actions={taskActions}
            label={overdueLabel(task.date, todayIso)}
          />
        ))}
        {missed.map(({ repeat, count }) => (
          <li key={repeat.id} className="task">
            <input
              type="checkbox"
              checked={false}
              onChange={() => repeatActions.makeUp(repeat.id)}
              aria-label={`Make up one: ${repeat.text}`}
            />
            <span className="task-text">
              <span className="task-mark">{repeat.goalId ? "🎯" : "🔁"} </span>
              {repeat.text} <span className="missed-count">{count}×</span>
            </span>
            <button className="clear-all" onClick={() => repeatActions.clearAll(repeat.id)}>
              clear all
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
