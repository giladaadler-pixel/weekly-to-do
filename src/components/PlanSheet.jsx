import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { canonicalLift, liftOptions } from "../lib/gym.js";
import { movePlanExercise, toggleExercise } from "../lib/plans.js";
import Icon from "./Icons.jsx";

// Create or edit one workout plan: its name, which exercises are in it, and their order.
// plan: { id?, name, exercises } — no id means a new plan.
// onSave({ id, name, exercises }) returns false when the name is blank.
// An exercise you've since removed from your list stays in the plan (marked) until you
// take it out here.
export default function PlanSheet({ plan, gym, onSave, onDelete, onAddExercise, onClose }) {
  const [name, setName] = useState(plan.name);
  const [exercises, setExercises] = useState(plan.exercises);
  const [nameError, setNameError] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const options = liftOptions(gym);
  const lower = exercises.map((e) => e.toLowerCase());

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !onSave({ id: plan.id, name, exercises })) {
      setNameError(true);
      e.currentTarget.querySelector("#plan-name")?.focus();
      return;
    }
    onClose();
  }

  function addNew() {
    const lift = canonicalLift(newName, gym);
    if (!lift) {
      setNewError(true);
      return;
    }
    onAddExercise(lift);
    if (!lower.includes(lift.toLowerCase())) setExercises((list) => [...list, lift]);
    setNewName("");
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal plan-sheet"
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={plan.id ? `Edit ${plan.name}` : "New plan"}
      >
        <h2>{plan.id ? "Edit plan" : "New plan"}</h2>
        <div className="form-field">
          <label htmlFor="plan-name">Name</label>
          <input
            id="plan-name"
            className="text-input"
            maxLength={40}
            value={name}
            autoFocus={!plan.name}
            aria-invalid={nameError || undefined}
            aria-describedby={nameError ? "plan-name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(false);
            }}
          />
          {nameError && (
            <span id="plan-name-error" className="field-error" role="alert">
              Enter a plan name
            </span>
          )}
        </div>

        <fieldset className="plan-pick">
          <legend className="muted small-text">Exercises</legend>
          <div className="plan-chips">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                className="rest-preset plan-chip"
                aria-pressed={lower.includes(o.toLowerCase())}
                onClick={() => setExercises((list) => toggleExercise(list, o))}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="plan-new">
            <input
              className="text-input"
              maxLength={40}
              placeholder="+ New exercise"
              aria-label="New exercise"
              aria-invalid={newError || undefined}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNew();
                }
              }}
            />
            <button type="button" className="ghost-button bordered" onClick={addNew}>
              Add
            </button>
          </div>
          {newError && (
            <span className="field-error" role="alert">
              Enter an exercise name
            </span>
          )}
        </fieldset>

        <div className="plan-order">
          <span className="muted small-text">In this plan, in order</span>
          {exercises.length === 0 && <p className="muted small-text">No exercises yet — you can add them later.</p>}
          <ol className="plan-order-list">
            {exercises.map((ex, i) => {
              const removed = !options.some((o) => o.toLowerCase() === ex.toLowerCase());
              return (
                <li key={ex} className="plan-order-row">
                  <span className="plan-order-name">
                    {ex}
                    {removed && <span className="muted small-text"> · removed from your list</span>}
                  </span>
                  <button
                    type="button"
                    className="square-button small"
                    disabled={i === 0}
                    onClick={() => setExercises((list) => movePlanExercise(list, i, -1))}
                    aria-label={`Move ${ex} up`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="square-button small"
                    disabled={i === exercises.length - 1}
                    onClick={() => setExercises((list) => movePlanExercise(list, i, 1))}
                    aria-label={`Move ${ex} down`}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="square-button small"
                    onClick={() => setExercises((list) => toggleExercise(list, ex))}
                    aria-label={`Take ${ex} out of this plan`}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {confirmingDelete ? (
          <div className="delete-choices" role="alert">
            <span>Delete {plan.name}? Your logged sets stay.</span>
            <button
              type="button"
              className="delete-button"
              onClick={() => {
                onDelete(plan.id);
                onClose();
              }}
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <div className="modal-buttons">
            {plan.id && (
              <button type="button" className="delete-button" onClick={() => setConfirmingDelete(true)}>
                Delete plan
              </button>
            )}
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary blue">
              Save
            </button>
          </div>
        )}
      </form>
    </div>,
    document.body,
  );
}
