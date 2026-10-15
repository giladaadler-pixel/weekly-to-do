import { dayLabel } from "../lib/dates.js";
import { sortTasks } from "../lib/tasks.js";
import TaskItem from "./TaskItem.jsx";
import AddTask from "./AddTask.jsx";
import OverdueSection from "./OverdueSection.jsx";

export default function DayColumn({ date, isToday, tasks, overdue, taskActions }) {
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
      {isToday && <OverdueSection tasks={overdue} todayIso={date} taskActions={taskActions} />}
      <AddTask onAdd={(text, priority) => taskActions.add(text, date, priority)} />
    </section>
  );
}
