import { weekDays } from "../lib/dates.js";
import { openGoals } from "../lib/goals.js";
import { overdueTasks } from "../lib/tasks.js";
import DayColumn from "./DayColumn.jsx";
import GoalsBand from "./GoalsBand.jsx";

export default function WeekView({
  weekStartIso,
  todayIso,
  tasks,
  repeats,
  goals,
  notes,
  taskActions,
  repeatActions,
  goalActions,
}) {
  return (
    <main className="week-page">
      <GoalsBand goals={openGoals(goals)} notes={notes} todayIso={todayIso} goalActions={goalActions} />
      <div className="week">
      {weekDays(weekStartIso).map((date) => (
        <DayColumn
          key={date}
          date={date}
          isToday={date === todayIso}
          tasks={tasks.filter((t) => t.date === date)}
          repeats={repeats}
          overdue={overdueTasks(tasks, todayIso)}
          taskActions={taskActions}
          repeatActions={repeatActions}
        />
      ))}
      </div>
    </main>
  );
}
