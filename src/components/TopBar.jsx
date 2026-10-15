import { formatWeekRange } from "../lib/dates.js";

// stats: { done, total } for the viewed week.
export default function TopBar({ page, onPage, viewWeek, onPrev, onNext, stats }) {
  return (
    <header className="top-bar">
      <nav className="page-switch">
        <button className={page === "week" ? "active" : undefined} onClick={() => onPage("week")}>
          Week
        </button>
        <button className={page === "goals" ? "active" : undefined} onClick={() => onPage("goals")}>
          Goals
        </button>
      </nav>
      {page === "week" && (
        <nav className="week-nav">
          <button onClick={onPrev} aria-label="Previous week">
            ◀
          </button>
          <span className="week-range">{formatWeekRange(viewWeek)}</span>
          <button onClick={onNext} aria-label="Next week">
            ▶
          </button>
        </nav>
      )}
      {page === "week" && stats.total > 0 && (
        <span className="stats">
          ✅ {stats.done} of {stats.total} done this week
        </span>
      )}
    </header>
  );
}
