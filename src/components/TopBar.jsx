import { formatWeekRange } from "../lib/dates.js";

// stats: { done, total } for the viewed week.
// onToday jumps back to the week holding today; its button only shows when viewing another week.
// ☰ lives in the sidebar, lined up with the left end of this bar.
export default function TopBar({
  page,
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
      {page === "gym" && <span className="page-name">Gym</span>}
      {page === "week" && (
        <nav className="week-nav">
          <button onClick={onPrev} aria-label="Previous week">
            ‹
          </button>
          <span className="week-range">{formatWeekRange(viewWeek)}</span>
          <button onClick={onNext} aria-label="Next week">
            ›
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
          <span className="stats-text">
            {stats.done} / {stats.total} done
          </span>
          <span className="stats-meter" aria-hidden="true">
            <span style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }} />
          </span>
        </span>
      )}
      <button
        className="theme-button"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          </svg>
        )}
      </button>
    </header>
  );
}
