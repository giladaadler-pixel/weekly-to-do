import { useState } from "react";
import { dayLabel } from "../lib/dates.js";
import { sortTasks } from "../lib/tasks.js";
import TaskItem from "./TaskItem.jsx";
import AddTask from "./AddTask.jsx";
import OverdueSection from "./OverdueSection.jsx";

export default function DayColumn({ date, isToday, tasks, overdue, taskActions }) {
  const [dropTarget, setDropTarget] = useState(false);
  const dayNumber = Number(date.slice(8));
  const className = ["day", isToday && "today", dropTarget && "drop-target"].filter(Boolean).join(" ");

  function onDrop(e) {
    e.preventDefault();
    setDropTarget(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) taskActions.move(id, date);
  }

  return (
    <section
      className={className}
      onDragOver={(e) => {
        e.preventDefault();
        setDropTarget(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(false);
      }}
      onDrop={onDrop}
    >
      <h2 className="day-header">
        <span className="day-label">{dayLabel(date)}</span>
        <span className="day-number">{dayNumber}</span>
      </h2>
      <ul className="task-list">
        {sortTasks(tasks).map((task) => (
          <TaskItem key={task.id} task={task} actions={taskActions} draggable />
        ))}
      </ul>
      {isToday && <OverdueSection tasks={overdue} todayIso={date} taskActions={taskActions} />}
      <AddTask onAdd={(text, priority) => taskActions.add(text, date, priority)} />
    </section>
  );
}
