import { dayLabel } from "../lib/dates.js";
import { sortTasks } from "../lib/tasks.js";
import TaskItem from "./TaskItem.jsx";
import AddTask from "./AddTask.jsx";

export default function DayColumn({ date, isToday, tasks, taskActions }) {
  const dayNumber = Number(date.slice(8));
  return (
    <section className={isToday ? "day today" : "day"}>
      <h2 className="day-header">
        <span className="day-label">{dayLabel(date)}</span>
        <span className="day-number">{dayNumber}</span>
      </h2>
      <ul className="task-list">
        {sortTasks(tasks).map((task) => (
          <TaskItem key={task.id} task={task} actions={taskActions} />
        ))}
      </ul>
      <AddTask onAdd={(text) => taskActions.add(text, date)} />
    </section>
  );
}
