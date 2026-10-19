import { useState } from "react";
import GoalChip from "./GoalChip.jsx";
import GoalModal from "./GoalModal.jsx";

export default function GoalsBand({ goals, todayIso, goalActions }) {
  const [creating, setCreating] = useState(false);
  // The one expanded chip's goal id, or null. Not saved: chips start collapsed.
  const [expandedId, setExpandedId] = useState(null);
  return (
    <section className="goals-band">
      {goals.map((goal) => (
        <GoalChip
          key={goal.id}
          goal={goal}
          actions={goalActions}
          expanded={goal.id === expandedId}
          onToggle={() => setExpandedId((id) => (id === goal.id ? null : goal.id))}
        />
      ))}
      <button className="create-button create-goal" onClick={() => setCreating(true)}>
        Create new goal+
      </button>
      {creating && (
        <GoalModal
          todayIso={todayIso}
          onCancel={() => setCreating(false)}
          onCreate={(fields) => {
            goalActions.create(fields);
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
