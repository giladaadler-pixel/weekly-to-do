import { useState } from "react";
import { dayLabel, formatShort } from "../lib/dates.js";
import { bestWeight, goalProgress, recordIds } from "../lib/gym.js";
import Icon from "./Icons.jsx";
import LiftField, { OTHER, resolveLift, useLiftChoice } from "./LiftField.jsx";

// History tab: strength goals (with progress) and every set logged, newest first.
export default function GymHistory({ gym, options, gymActions }) {
  const goalLift = useLiftChoice();
  const [target, setTarget] = useState("");
  const [due, setDue] = useState("");

  const { logs, lifts } = gym;
  const records = recordIds(logs);
  const history = [...logs].reverse();

  function addGoal(e) {
    e.preventDefault();
    const lift = resolveLift(goalLift, gym, e.currentTarget);
    if (!lift) return;
    if (gymActions.addLift({ lift, target, due })) {
      setTarget("");
      setDue("");
      if (goalLift.choice === OTHER) goalLift.pick(lift);
    }
  }

  return (
    <>
      <section className="panel" aria-labelledby="lift-goals">
        <h2 id="lift-goals" className="kicker">
          Strength goals
        </h2>
        {lifts.length === 0 && <p className="muted">Add a target below — like bench press 225.</p>}
        {lifts.map((g) => {
          const best = bestWeight(logs, g.lift);
          const pct = goalProgress(logs, g);
          return (
            <div key={g.id} className="lift-goal">
              <div className="lift-goal-head">
                <span className="lift-goal-name">
                  {g.lift} {g.target}
                </span>
                {g.due && <span className="mono muted small-text">Due {formatShort(g.due)}</span>}
                <span className="mono accent lift-goal-pct">{pct}%</span>
                <button
                  className="square-button small"
                  onClick={() => gymActions.removeLift(g.id)}
                  aria-label={`Remove goal ${g.lift} ${g.target}`}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <span className="mono muted small-text">
                {best
                  ? `Best ${best} / ${g.target} lbs`
                  : `No ${g.lift.toLowerCase()} sets yet · target ${g.target} lbs`}
              </span>
            </div>
          );
        })}
        <form className="inline-form" onSubmit={addGoal}>
          <LiftField field={goalLift} options={options} />
          <label className="form-field narrow">
            <span>Target lbs</span>
            <input
              className="text-input"
              type="number"
              inputMode="decimal"
              min="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <label className="form-field narrow">
            <span>Due</span>
            <input className="text-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <button className="ghost-button bordered" type="submit">
            Add goal
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="set-history">
        <h2 id="set-history" className="kicker">
          Set history
        </h2>
        {history.length === 0 && <p className="muted">No sets logged yet. Log your first set to start tracking.</p>}
        <ul className="set-list">
          {history.map((l) => (
            <li key={l.id} className="set-row">
              <span className="mono muted set-date">
                {dayLabel(l.date)} {Number(l.date.slice(8))}
              </span>
              <span className="set-lift">{l.lift}</span>
              <span className="mono">
                {l.weight} × {l.reps}
              </span>
              {records.has(l.id) && <span className="pr-tag mono">PR</span>}
              <button
                className="square-button small"
                onClick={() => gymActions.removeLog(l.id)}
                aria-label={`Remove ${l.lift} ${l.weight} × ${l.reps}`}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
