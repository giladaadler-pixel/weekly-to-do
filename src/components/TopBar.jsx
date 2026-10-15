import { formatWeekRange } from "../lib/dates.js";

// stats: { done, total } for the viewed week.
// onToday jumps back to the week holding today; its button only shows when viewing another week.
export default function TopBar({
  page,
  onPage,
  viewWeek,
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
  stats,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="top-bar">
      <nav className="page-switch">
        <button className={page === "week" ? "active" : undefined} onClick={() => onPage("week")}>
          Week
        </button>
        <button
          className={page === "accomplishments" ? "active" : undefined}
          onClick={() => onPage("accomplishments")}
        >
          Accomplishments
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
          {!isCurrentWeek && (
            <button className="today-button" onClick={onToday} aria-label="Go to current week">
              Today
            </button>
          )}
        </nav>
      )}
      {page === "week" && stats.total > 0 && (
        <span className="stats">
          ✅ {stats.done} of {stats.total} done this week
        </span>
      )}
      <button
        className="theme-button"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
