import { weekDays } from "../lib/dates.js";
import DayColumn from "./DayColumn.jsx";

export default function WeekView({ weekStartIso, todayIso, tasks, taskActions }) {
  return (
    <div className="week">
      {weekDays(weekStartIso).map((date) => (
        <DayColumn
          key={date}
          date={date}
          isToday={date === todayIso}
          tasks={tasks.filter((t) => t.date === date)}
          taskActions={taskActions}
        />
      ))}
    </div>
  );
}
