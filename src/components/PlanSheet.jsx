import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { canonicalLift, liftOptions } from "../lib/gym.js";
import { STARTER_PLANS, findPlanByName, movePlanExercise, toggleExercise } from "../lib/plans.js";
import Icon from "./Icons.jsx";

// Create or edit one workout plan: its name, which exercises are in it, and their order.
// This is also where you manage your exercises: add new ones, and ✕ removes one of your
// own from your list (built-ins can't be removed). Removing keeps its sets, and it stays
// in any plan that uses it, marked, until you take it out here.
// plan: { id?, name, exercises } — no id means a new plan, with name suggestions
// (Push day, Pull day…) above the name field.
// onSave({ id, name, exercises }) returns false when the name is blank.
export default function PlanSheet({ plan, gym, onSave, onDelete, onAddExercise, onForgetExercise, onClose }) {
  const [name, setName] = useState(plan.name);
  const [exercises, setExercises] = useState(plan.exercises);
  // "" or the message under the name field.
  const [nameError, setNameError] = useState("");
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
    const twin = findPlanByName(gym.plans, name);
    const error = !name.trim()
      ? "Enter a plan name"
      : twin && twin.id !== plan.id
        ? `You already have ${twin.name}. Pick another name, or edit that one.`
        : "";
    if (error || !onSave({ id: plan.id, name, exercises })) {
      setNameError(error || "Enter a plan name");
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
        {!plan.id && (
          <div className="plan-starters" role="group" aria-label="Name suggestions">
            {STARTER_PLANS.map((s) => (
              <button
                key={s}
                type="button"
                className="rest-preset"
                aria-pressed={name === s}
                onClick={() => {
                  setName(s);
                  setNameError("");
                }}
              >
                {s.replace(/ day$/, "")}
              </button>
            ))}
          </div>
        )}
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
              setNameError("");
            }}
          />
          {nameError && (
            <span id="plan-name-error" className="field-error" role="alert">
              {nameError}
            </span>
          )}
        </div>

        <fieldset className="plan-pick">
          <legend className="muted small-text">Exercises</legend>
          <div className="plan-chips">
            {options.map((o) => {
              const own = gym.customLifts.includes(o);
              return (
                <span key={o} className={`plan-chip-wrap${own ? " own" : ""}`}>
                  <button
                    type="button"
                    className="rest-preset plan-chip"
                    aria-pressed={lower.includes(o.toLowerCase())}
                    onClick={() => setExercises((list) => toggleExercise(list, o))}
                  >
                    {o}
                  </button>
                  {own && onForgetExercise && (
                    <button
                      type="button"
                      className="plan-chip-remove"
                      onClick={() => onForgetExercise(o)}
                      aria-label={`Remove ${o} from your list. Its sets and plans stay.`}
                      title="Remove from your list. Its sets and plans stay."
                    >
                      <Icon name="close" size={10} />
                    </button>
                  )}
                </span>
              );
            })}
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
