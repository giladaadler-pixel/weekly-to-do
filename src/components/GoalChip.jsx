import { useEffect, useState } from "react";
import { formatShort } from "../lib/dates.js";
import { convertStyle } from "../lib/goals.js";
import { celebrate } from "../lib/celebrate.js";
import PriorityDot from "./PriorityDot.jsx";
import PrioritySelect from "./PrioritySelect.jsx";
import StyleSelect from "./StyleSelect.jsx";
import GoalDescription from "./GoalDescription.jsx";

// One unfinished goal in the goals band. Collapsed it's one line:
// [dot] title · Due Jun 1 · ✓. Clicking the header expands it in place to show the
// description and edit controls; GoalsBand keeps only one expanded at a time.
// Marking it done sends it to Accomplishments.
export default function GoalChip({ goal, actions, expanded, onToggle }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const update = (changes) => actions.update(goal.id, changes);

  useEffect(() => {
    if (!expanded) {
      setConfirmingDelete(false);
      return;
    }
    function onKey(e) {
      if (e.key === "Escape") onToggle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, onToggle]);

  function onHeaderKey(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <article className={expanded ? "goal-chip expanded" : "goal-chip"}>
      <div
        className="goal-chip-header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={onHeaderKey}
      >
        <PriorityDot priority={goal.priority} />
        <span className="goal-chip-title">{goal.title}</span>
        {goal.dueDate && <span className="goal-chip-due">Due {formatShort(goal.dueDate)}</span>}
        {/* Spot for the "📝 N" notes count, once goal notes exist. */}
        <button
          className="goal-check"
          onClick={(e) => {
            e.stopPropagation();
            celebrate(e.currentTarget);
            actions.setDone(goal.id, true);
          }}
          aria-label="Mark goal done"
        >
          ✓
        </button>
      </div>
      {expanded && (
        <div className="goal-chip-body">
          <div className="goal-meta">
            <PrioritySelect value={goal.priority} onChange={(priority) => update({ priority })} />
          </div>
          <GoalDescription goal={goal} onChange={update} />
          {confirmingDelete ? (
            <div className="goal-confirm">
              <span>Delete this goal? Its 🎯 repeating tasks go too.</span>
              <div className="goal-confirm-buttons">
                <button onClick={() => setConfirmingDelete(false)}>Cancel</button>
                <button className="danger" onClick={() => actions.remove(goal.id)}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <footer className="goal-footer">
              <StyleSelect value={goal.style} onChange={(style) => actions.replace(convertStyle(goal, style))} />
              <button className="icon-button" onClick={() => setConfirmingDelete(true)} aria-label="Delete goal">
                🗑
              </button>
            </footer>
          )}
        </div>
      )}
    </article>
  );
}
