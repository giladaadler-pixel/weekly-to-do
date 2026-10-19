import { useState } from "react";
import { dayLabel } from "../lib/dates.js";
import { dayRows } from "../lib/today.js";
import DayTaskList from "./DayTaskList.jsx";
import TaskModal from "./TaskModal.jsx";
import OverdueSection from "./OverdueSection.jsx";

export default function DayColumn({ date, isToday, tasks, repeats, overdue, taskActions, repeatActions }) {
  const [dropTarget, setDropTarget] = useState(false);
  const [creating, setCreating] = useState(false);
  const dayNumber = Number(date.slice(8));
  const className = ["day", isToday && "today", dropTarget && "drop-target"].filter(Boolean).join(" ");

  const rows = dayRows(tasks, repeats, date);

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
      <div className="day-header">
        <h2 className="day-title">
          <span className="day-label">{dayLabel(date)}</span> <span className="day-number">{dayNumber}</span>
        </h2>
        <button className="create-button create-task" onClick={() => setCreating(true)}>
          Create new task+
        </button>
      </div>
      <div className="day-body">
        <DayTaskList rows={rows} date={date} taskActions={taskActions} repeatActions={repeatActions} draggable />
        {isToday && (
          <OverdueSection
            tasks={overdue}
            repeats={repeats}
            todayIso={date}
            taskActions={taskActions}
            repeatActions={repeatActions}
          />
        )}
      </div>
      {creating && (
        <TaskModal
          onCancel={() => setCreating(false)}
          onCreate={(text, priority, days) => {
            taskActions.add(text, date, priority, days);
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
