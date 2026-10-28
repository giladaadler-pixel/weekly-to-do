import { useState } from "react";
import { STARTER_PLANS, findPlanByName } from "../lib/plans.js";
import PlanSheet from "./PlanSheet.jsx";

// Plans tab: one card per workout plan, and quick ways to start a new one.
// A quick-start (or typed name) that matches an existing plan opens that plan instead.
// onStart(plan) and onCalendar(plan) are optional: their buttons show only when given.
export default function GymPlans({ gym, gymActions, onStart, onCalendar }) {
  // The plan open in the sheet: { id?, name, exercises }, or null.
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(false);
  const { plans } = gym;

  function open(name) {
    const existing = findPlanByName(plans, name);
    setEditing(existing ?? { name: name.trim().replace(/\s+/g, " "), exercises: [] });
  }

  function onCreate(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setError(true);
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    open(newName);
    setNewName("");
  }

  return (
    <>
      {plans.length === 0 && (
        <section className="panel">
          <h2 className="kicker">Plans</h2>
          <p className="muted">No plans yet. Make one below — like a push day with bench press and overhead press.</p>
        </section>
      )}
      {plans.map((p) => (
        <section key={p.id} className="panel plan-card" aria-label={p.name}>
          <h2 className="plan-card-name">{p.name}</h2>
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
        </section>
      ))}

      <section className="panel" aria-labelledby="create-plan">
        <h2 id="create-plan" className="kicker">
          Create plan
        </h2>
        <div className="plan-starters">
          {STARTER_PLANS.map((name) => (
            <button key={name} type="button" className="rest-preset" onClick={() => open(name)}>
              {name.replace(/ day$/, "")}
            </button>
          ))}
        </div>
        <form className="inline-form plan-create" onSubmit={onCreate}>
          <div className="form-field">
            <label htmlFor="new-plan-name">Or any name</label>
            <input
              id="new-plan-name"
              className="text-input"
              maxLength={40}
              placeholder="e.g. Arms and abs"
              aria-invalid={error || undefined}
              aria-describedby={error ? "new-plan-error" : undefined}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(false);
              }}
            />
            {error && (
              <span id="new-plan-error" className="field-error" role="alert">
                Enter a plan name
              </span>
            )}
          </div>
          <button className="ghost-button bordered" type="submit">
            Create
          </button>
        </form>
      </section>

      {editing && (
        <PlanSheet
          key={editing.id ?? editing.name}
          plan={editing}
          gym={gym}
          onSave={gymActions.savePlan}
          onDelete={gymActions.deletePlan}
          onAddExercise={gymActions.addExercise}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
