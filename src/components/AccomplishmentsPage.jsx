import { formatLong, toISO } from "../lib/dates.js";
import { accomplishments } from "../lib/goals.js";

// The goal's description on one dim line: the paragraph, or its items joined.
function goalNotes(goal) {
  if (goal.style === "paragraph") return goal.text?.trim() ?? "";
  return (goal.items ?? []).map((item) => item.text).join(" · ");
}

export default function AccomplishmentsPage({ goals, onMarkNotDone }) {
  const done = accomplishments(goals);
  return (
    <main className="accomplishments-page">
      <h1 className="accomplishments-title">🏆 Accomplishments</h1>
      {done.length === 0 ? (
        <p className="accomplishments-empty">No accomplishments yet. Finish a goal and it'll show up here.</p>
      ) : (
        <ul className="accomplishments-list">
          {done.map((goal) => {
            const notes = goalNotes(goal);
            return (
              <li key={goal.id} className="accomplishment">
                <span className="accomplishment-icon" aria-hidden="true">
                  ✓
                </span>
                <div className="accomplishment-main">
                  <span className="accomplishment-name">{goal.title}</span>
                  {notes && <span className="accomplishment-notes">{notes}</span>}
                </div>
                <div className="accomplishment-meta">
                  <span className="accomplishment-date">
                    {goal.completedAt ? formatLong(toISO(new Date(goal.completedAt))) : "Completed"}
                  </span>
                  <button className="mark-not-done" onClick={() => onMarkNotDone(goal.id)}>
                    Mark not done
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
