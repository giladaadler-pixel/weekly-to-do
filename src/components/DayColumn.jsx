import { useState } from "react";
import { dayLabel } from "../lib/dates.js";
import { sortTasks } from "../lib/tasks.js";
import { occursOn, isDoneOn } from "../lib/repeats.js";
import TaskItem from "./TaskItem.jsx";
import AddTask from "./AddTask.jsx";
import OverdueSection from "./OverdueSection.jsx";

export default function DayColumn({ date, isToday, tasks, repeats, overdue, taskActions, repeatActions }) {
  const [dropTarget, setDropTarget] = useState(false);
  const dayNumber = Number(date.slice(8));
  const className = ["day", isToday && "today", dropTarget && "drop-target"].filter(Boolean).join(" ");

  // Tasks and this day's repeat copies, sorted together by the same rules.
  const rows = sortTasks([
    ...tasks,
    ...repeats
      .filter((r) => occursOn(r, date))
      .map((r) => ({ id: r.id, text: r.text, priority: r.priority, done: isDoneOn(r, date), repeat: r })),
  ]);

  // TaskItem calls these with the repeat's id; they act on this day's copy.
  const repeatDayActions = {
    toggle: (id) => repeatActions.toggle(id, date),
    setPriority: repeatActions.setPriority,
    edit: repeatActions.edit,
  };

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
        {rows.map((row) =>
          row.repeat ? (
            <TaskItem
              key={row.id}
              task={row}
              actions={repeatDayActions}
              mark="🔁"
              deleteChoices={[
                { label: "Just this day", onClick: () => repeatActions.deleteOne(row.id, date) },
                { label: "This and all future days", onClick: () => repeatActions.deleteFuture(row.id, date) },
              ]}
            />
          ) : (
            <TaskItem key={row.id} task={row} actions={taskActions} draggable />
          )
        )}
      </ul>
      {isToday && (
        <OverdueSection
          tasks={overdue}
          repeats={repeats}
          todayIso={date}
          taskActions={taskActions}
          repeatActions={repeatActions}
        />
      )}
      <AddTask onAdd={(text, priority, days) => taskActions.add(text, date, priority, days)} />
    </section>
  );
}
