import { useState } from "react";
import GoalCard from "./GoalCard.jsx";
import GoalModal from "./GoalModal.jsx";

export default function GoalsBand({ goals, todayIso, goalActions }) {
  const [creating, setCreating] = useState(false);
  return (
    <section className="goals-band">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} actions={goalActions} />
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
