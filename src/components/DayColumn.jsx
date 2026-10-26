import { useState } from "react";
import { dayLabel } from "../lib/dates.js";
import { dayRows } from "../lib/today.js";
import DayTaskList from "./DayTaskList.jsx";
import TaskModal from "./TaskModal.jsx";
import OverdueSection from "./OverdueSection.jsx";

export default function DayColumn({ date, isToday, tasks, repeats, overdue, taskActions, repeatActions, onOpenDay }) {
  const [dropTarget, setDropTarget] = useState(false);
  const [creating, setCreating] = useState(false);
  const dayNumber = Number(date.slice(8));
  const className = ["day", isToday && "today", dropTarget && "drop-target"].filter(Boolean).join(" ");

  const rows = dayRows(tasks, repeats, date);

  // Tapping the box itself (not a task, button or the add-task popup) opens the day calendar.
  function onBoxClick(e) {
    if (e.target.closest("button, input, select, textarea, label, a, li, .modal-backdrop")) return;
    onOpenDay?.(date);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropTarget(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) taskActions.move(id, date);
  }

  return (
    <section
      className={className}
      onClick={onBoxClick}
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
          <button className="day-open" onClick={() => onOpenDay?.(date)} title="Open this day's schedule">
            <span className="day-label">{dayLabel(date)}</span> <span className="day-number">{dayNumber}</span>
            {isToday && <span className="today-tag">Today</span>}
            <span className="day-open-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        </h2>
        <button className="create-button create-task" onClick={() => setCreating(true)}>
          + Add task
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
