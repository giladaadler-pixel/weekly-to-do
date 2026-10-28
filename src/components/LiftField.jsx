import { useId, useRef, useState } from "react";
import { LIFTS, canonicalLift, liftOptions } from "../lib/gym.js";

export const OTHER = "__other__";

// State for one Lift field: the dropdown choice (a lift, or OTHER while typing a new one),
// the typed name, and whether to show "Enter an exercise name".
export function useLiftChoice() {
  const [choice, setChoice] = useState(LIFTS[0]);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  // What the dropdown showed before "Other…", for Esc.
  const previous = useRef(LIFTS[0]);
  return {
    choice,
    name,
    error,
    choose(value) {
      if (value === OTHER && choice !== OTHER) previous.current = choice;
      setChoice(value);
      setError(false);
    },
    type(value) {
      setName(value);
      setError(false);
    },
    // Back to the dropdown (Esc), or straight to a lift (after saving a new one).
    pick(lift = previous.current) {
      setChoice(lift);
      setName("");
      setError(false);
    },
    showError() {
      setError(true);
    },
  };
}

// The Lift dropdown, plus a name box under it when "Other…" is picked.
// Enter in the box submits the form; Esc goes back to the dropdown.
export default function LiftField({ field, options }) {
  const id = useId();
  const selectRef = useRef(null);
  const other = field.choice === OTHER;
  // A removed lift that was still selected falls back to the first one.
  const value = other || options.includes(field.choice) ? field.choice : options[0];

  function onKeyDown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    field.pick();
    requestAnimationFrame(() => selectRef.current?.focus());
  }

  return (
    <div className="form-field lift-field">
      <label htmlFor={`${id}-select`}>Lift</label>
      <select
        id={`${id}-select`}
        ref={selectRef}
        className="text-input"
        value={value}
        onChange={(e) => field.choose(e.target.value)}
      >
        {options.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {other && (
        <div className="lift-other">
          <input
            className="text-input"
            type="text"
            autoFocus
            maxLength={40}
            placeholder="Exercise name (e.g. Incline DB press)"
            aria-label="Exercise name"
            aria-invalid={field.error || undefined}
            aria-describedby={field.error ? `${id}-error` : undefined}
            value={field.name}
            onChange={(e) => field.type(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {field.error && (
            <span id={`${id}-error`} className="field-error" role="alert">
              Enter an exercise name
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// The lift a form should save, or "" (after showing the error and focusing the box) if
// "Other…" is blank. A typed name takes the spelling of a lift it matches, ignoring case.
export function resolveLift(field, gym, form) {
  if (field.choice !== OTHER) return liftOptions(gym).includes(field.choice) ? field.choice : LIFTS[0];
  const lift = canonicalLift(field.name, gym);
  if (!lift) {
    field.showError();
    form.querySelector(".lift-other input")?.focus();
  }
  return lift;
}
