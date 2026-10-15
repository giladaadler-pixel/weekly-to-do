import { formatWeekRange } from "../lib/dates.js";

export default function TopBar({ viewWeek, onPrev, onNext }) {
  return (
    <header className="top-bar">
      <nav className="week-nav">
        <button onClick={onPrev} aria-label="Previous week">
          ◀
        </button>
        <span className="week-range">{formatWeekRange(viewWeek)}</span>
        <button onClick={onNext} aria-label="Next week">
          ▶
        </button>
      </nav>
    </header>
  );
}
