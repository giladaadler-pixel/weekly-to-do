import { weekDays } from "../lib/dates.js";
import DayColumn from "./DayColumn.jsx";

export default function WeekView({ weekStartIso, todayIso }) {
  return (
    <div className="week">
      {weekDays(weekStartIso).map((date) => (
        <DayColumn key={date} date={date} isToday={date === todayIso} />
      ))}
    </div>
  );
}
