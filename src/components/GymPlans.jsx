import { useState } from "react";
import PlanSheet from "./PlanSheet.jsx";

// "Your workout plans", at the top of the Workout tab: one card per plan, and Add workout
// plan, which opens the plan sheet on a new, empty plan.
// onStart(plan) and onCalendar(plan) are optional: their buttons show only when given.
export default function GymPlans({ gym, gymActions, onStart, onCalendar }) {
  // The plan open in the sheet: { id?, name, exercises }, or null.
  const [editing, setEditing] = useState(null);
  const { plans } = gym;

  return (
    <section className="panel gym-plans" aria-labelledby="your-plans">
      <div className="gym-plans-head">
        <h2 id="your-plans" className="kicker">
          Your workout plans
        </h2>
        <button type="button" className="ghost-button bordered" onClick={() => setEditing({ name: "", exercises: [] })}>
          Add workout plan
        </button>
      </div>
      {plans.length === 0 && <p className="muted">No plans yet</p>}
      {plans.map((p) => (
        <article key={p.id} className="plan-card" aria-label={p.name}>
          <h3 className="plan-card-name">{p.name}</h3>
          {p.exercises.length > 0 ? (
            <ul className="plan-tags">
              {p.exercises.map((ex) => (
                <li key={ex} className="plan-tag">
                  {ex}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small-text">No exercises yet.</p>
          )}
          <div className="plan-card-actions">
            {onStart && (
              <button type="button" className="accent-button" onClick={() => onStart(p)}>
                Start
              </button>
            )}
            <button type="button" className="ghost-button bordered" onClick={() => setEditing(p)}>
              Edit
            </button>
            {onCalendar && (
              <button type="button" className="ghost-button bordered" onClick={() => onCalendar(p)}>
                Add to calendar
              </button>
            )}
          </div>
        </article>
      ))}

      {editing && (
        <PlanSheet
          key={editing.id ?? "new"}
          plan={editing}
          gym={gym}
          onSave={gymActions.savePlan}
          onDelete={gymActions.deletePlan}
          onAddExercise={gymActions.addExercise}
          onForgetExercise={gymActions.forgetLift}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
