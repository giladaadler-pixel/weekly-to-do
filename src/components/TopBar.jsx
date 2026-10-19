import { formatWeekRange } from "../lib/dates.js";

// stats: { done, total } for the viewed week.
// onToday jumps back to the week holding today; its button only shows when viewing another week.
// onMenu is the ☰ button, which opens the sidebar.
export default function TopBar({
  page,
  onMenu,
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
              This week
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
      <button className="menu-button" onClick={onMenu} aria-label="Open sidebar">
        ☰
      </button>
    </header>
  );
}
