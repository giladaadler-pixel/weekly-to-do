import { dayLabel } from "../lib/dates.js";

export default function DayColumn({ date, isToday, children }) {
  const dayNumber = Number(date.slice(8));
  return (
    <section className={isToday ? "day today" : "day"}>
      <h2 className="day-header">
        <span className="day-label">{dayLabel(date)}</span>
        <span className="day-number">{dayNumber}</span>
      </h2>
      {children}
    </section>
  );
}
