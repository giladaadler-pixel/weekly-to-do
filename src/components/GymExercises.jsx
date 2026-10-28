import { useState } from "react";
import { LIFTS, canonicalLift } from "../lib/gym.js";
import Icon from "./Icons.jsx";

// Exercises tab: add your own exercises, and remove them from the list. Removing one
// keeps its sets, goals and any plan that lists it.
export default function GymExercises({ gym, gymActions }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function onAdd(e) {
    e.preventDefault();
    const lift = canonicalLift(name, gym);
    if (!lift) {
      setError("Enter an exercise name");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    const known = [...LIFTS, ...gym.customLifts].includes(lift);
    if (!known) gymActions.addExercise(lift);
    setMessage(known ? `${lift} is already on your list.` : `Added ${lift}.`);
    setName("");
  }

  return (
    <section className="panel" aria-labelledby="exercise-list">
      <h2 id="exercise-list" className="kicker">
        Exercises
      </h2>
      <form className="inline-form exercise-add" onSubmit={onAdd}>
        <div className="form-field">
          <label htmlFor="new-exercise">New exercise</label>
          <input
            id="new-exercise"
            className="text-input"
            type="text"
            maxLength={40}
            placeholder="Exercise name (e.g. Incline DB press)"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? "new-exercise-error" : undefined}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
          {error && (
            <span id="new-exercise-error" className="field-error" role="alert">
              {error}
            </span>
          )}
        </div>
        <button className="ghost-button bordered" type="submit">
          Add
        </button>
      </form>
      <p className="muted small-text" role="status">
        {message}
      </p>
      <ul className="exercise-list">
        {LIFTS.map((l) => (
          <li key={l} className="exercise-row">
            <span>{l}</span>
            <span className="muted small-text">Built-in</span>
          </li>
        ))}
        {gym.customLifts.map((l) => (
          <li key={l} className="exercise-row">
            <span>{l}</span>
            <button
              type="button"
              className="square-button small"
              onClick={() => gymActions.forgetLift(l)}
              aria-label={`Remove ${l} from your list. Its sets and plans stay.`}
              title="Remove from your list. Its sets and plans stay."
            >
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
