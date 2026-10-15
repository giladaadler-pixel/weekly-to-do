import { weekDays } from "../lib/dates.js";
import { overdueTasks } from "../lib/tasks.js";
import DayColumn from "./DayColumn.jsx";

export default function WeekView({ weekStartIso, todayIso, tasks, repeats, taskActions, repeatActions }) {
  return (
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
  );
}
