import { useState } from "react";
import { MAX_PLANS } from "../lib/plans.js";
import Icon from "./Icons.jsx";
import PlanSheet from "./PlanSheet.jsx";

// "Your workout plans", at the top of the Workout tab: a header row (with the count out of
// MAX_PLANS and "+ Add workout plan"), then a grid of plan cards. Under MAX_PLANS a dashed
// "New plan" cell follows the cards; at MAX_PLANS adding is off. That's only a cap on
// adding: anyone with more plans still sees them all.
// onStart(plan) and onCalendar(plan) are optional: their buttons show only when given.
export default function GymPlans({ gym, gymActions, onStart, onCalendar }) {
  // The plan open in the sheet: { id?, name, exercises }, or null.
  const [editing, setEditing] = useState(null);
  const { plans } = gym;
  const full = plans.length >= MAX_PLANS;
  const addNew = () => setEditing({ name: "", exercises: [] });

  return (
    <section className="gym-plans" aria-labelledby="your-plans">
      <div className="gym-plans-head">
        <h2 id="your-plans" className="kicker">
          Your workout plans · <span className="plan-count">{plans.length} / {MAX_PLANS}</span>
        </h2>
        <button
          type="button"
          className="ghost-button bordered gym-plans-add"
          disabled={full}
          title={full ? `You can have up to ${MAX_PLANS} plans` : undefined}
          onClick={addNew}
        >
          + Add workout plan
        </button>
      </div>
      {plans.length === 0 && <p className="muted small-text">No plans yet</p>}
      <div className="plan-grid">
        {plans.map((p) => (
          <article key={p.id} className="plan-card" aria-label={p.name}>
            <div className="plan-card-top">
              <span className="kicker accent">
                {p.exercises.length} {p.exercises.length === 1 ? "lift" : "lifts"}
              </span>
              <h3 className="plan-card-name">{p.name}</h3>
            </div>
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
              <div className="plan-card-row">
                <button type="button" className="ghost-button bordered" onClick={() => setEditing(p)}>
                  Edit
                </button>
                {onCalendar && (
                  <button
                    type="button"
                    className="ghost-button bordered"
                    onClick={() => onCalendar(p)}
                    aria-label={`Add ${p.name} to calendar`}
                  >
                    <Icon name="calendar-plus" size={14} />
                    Calendar
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {!full && (
          <button type="button" className="plan-new-card" onClick={addNew}>
            <Icon name="plus" size={20} />
            New plan
          </button>
        )}
      </div>

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
