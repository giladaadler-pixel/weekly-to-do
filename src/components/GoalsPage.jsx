import { useState } from "react";
import { addMonths, monthHeader, monthKey } from "../lib/dates.js";
import { goalsForMonth } from "../lib/goals.js";

export default function GoalsPage({ goals, todayIso, goalActions }) {
  const [month, setMonth] = useState(() => monthKey(todayIso));
  const monthGoals = goalsForMonth(goals, month);
  return (
    <section className="goals-page">
      <div className="month-nav">
        <button onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
          ◀
        </button>
        <h1 className="month-header">{monthHeader(month)}</h1>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
          ▶
        </button>
      </div>
      {monthGoals.length === 0 && <p className="empty">No goals this month.</p>}
      <ul className="goals-list">
        {monthGoals.map((goal) => (
          <li key={goal.id} className={goal.done ? "done" : undefined}>
            <label>
              <input
                type="checkbox"
                checked={goal.done}
                onChange={() => goalActions.update(goal.id, { done: !goal.done })}
              />
              <span className="done-text">
                {goal.done && <span className="check">✓ </span>}
                {goal.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
