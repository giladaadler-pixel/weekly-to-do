import { overdueLabel } from "../lib/tasks.js";
import TaskItem from "./TaskItem.jsx";

export default function OverdueSection({ tasks, todayIso, taskActions }) {
  if (tasks.length === 0) return null;
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
      </ul>
    </div>
  );
}
