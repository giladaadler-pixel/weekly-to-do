import TaskItem from "./TaskItem.jsx";

// One day's rows (from dayRows) as TaskItems. Repeat copies get the 🔁/🎯 mark and
// act on this day's copy; one-off tasks can be dragged when draggable is set.
// Used by the day boxes and the day page. children go at the end of the list (the day
// box's "✓ N done" row).
export default function DayTaskList({ rows, date, taskActions, repeatActions, draggable = false, className = "", children }) {
  // TaskItem calls these with the repeat's id; they act on this day's copy.
  const repeatDayActions = {
    toggle: (id) => repeatActions.toggle(id, date),
    setPriority: repeatActions.setPriority,
    edit: repeatActions.edit,
  };

  return (
    <ul className={`task-list ${className}`.trim()}>
      {rows.map((row) =>
        row.repeat ? (
          <TaskItem
            key={row.id}
            task={row}
            actions={repeatDayActions}
            mark={row.repeat.goalId ? "🎯" : "🔁"}
            deleteChoices={[
              { label: "Just this day", onClick: () => repeatActions.deleteOne(row.id, date) },
              { label: "This and all future days", onClick: () => repeatActions.deleteFuture(row.id, date) },
            ]}
          />
        ) : (
          <TaskItem key={row.id} task={row} actions={taskActions} draggable={draggable} />
        )
      )}
      {children}
    </ul>
  );
}
