import { useState } from "react";
import { weekDays, weekStart, dayLabel, formatShort } from "../lib/dates.js";
import { bestWeight, goalProgress, liftOptions, recordIds, trainedOn } from "../lib/gym.js";
import Icon from "./Icons.jsx";
import LiftField, { OTHER, resolveLift, useLiftChoice } from "./LiftField.jsx";

// Strength goals, this week's training days, logging sets and the set history.
// gymActions: { addLog({ lift, weight, reps }), removeLog(id), addLift({ lift, target, due }), removeLift(id),
//   forgetLift(name) }
export default function GymPage({ gym, todayIso, gymActions, onOpenDay }) {
  const logLift = useLiftChoice();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const goalLift = useLiftChoice();
  const [target, setTarget] = useState("");
  const [due, setDue] = useState("");
  const [message, setMessage] = useState("");

  const { logs, lifts, customLifts } = gym;
  const options = liftOptions(gym);
  const days = weekDays(weekStart(todayIso));
  const sessions = days.filter((d) => trainedOn(logs, d)).length;
  const bestBench = bestWeight(logs, "Bench press");
  const records = recordIds(logs);
  const history = [...logs].reverse();

  function logSet(e) {
    e.preventDefault();
    const lift = resolveLift(logLift, gym, e.currentTarget);
    if (!lift) return;
    const before = bestWeight(logs, lift);
    const ok = gymActions.addLog({ lift, weight, reps });
    if (!ok) {
      setMessage("Enter a weight and reps first.");
      return;
    }
    setMessage(Number(weight) > before ? `New PR — ${lift} ${Number(weight)} lbs` : `Logged ${lift} ${weight} × ${reps}`);
    setWeight("");
    setReps("");
    if (logLift.choice === OTHER) logLift.pick(lift);
  }

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
    <main className="gym-page">
      <header className="page-header">
        <span className="kicker">Training</span>
        <h1>Gym tracker</h1>
      </header>

      <div className="stat-grid">
        <div className="panel stat">
          <span className="kicker">Sessions this week</span>
          <span className="stat-value accent mono">{sessions}</span>
        </div>
        <div className="panel stat">
          <span className="kicker">Best bench</span>
          <span className="stat-value mono">{bestBench ? `${bestBench} lbs` : "—"}</span>
        </div>
        <div className="panel stat">
          <span className="kicker">Sets logged</span>
          <span className="stat-value mono">{logs.length}</span>
        </div>
      </div>

      <section className="gym-strip" aria-label="Training days this week">
        {days.map((d) => {
          const trained = trainedOn(logs, d);
          return (
            <button
              key={d}
              className={`panel gym-day${trained ? " trained" : ""}${d === todayIso ? " is-today" : ""}`}
              onClick={() => onOpenDay(d)}
              aria-label={`${dayLabel(d)} ${formatShort(d)}, ${trained ? "trained" : "no sets"}. Open schedule`}
            >
              <span className="mono muted">
                {dayLabel(d)} {Number(d.slice(8))}
              </span>
              <span className="gym-dot" />
            </button>
          );
        })}
      </section>

      <div className="gym-body">
        <div className="gym-main">
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
                    {best ? `Best ${best} / ${g.target} lbs` : `No ${g.lift.toLowerCase()} sets yet · target ${g.target} lbs`}
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
        </div>

        <form className="panel glow-panel log-form" onSubmit={logSet}>
          <h2 className="kicker accent">Log a set</h2>
          <LiftField field={logLift} options={options} />
          <div className="stepper-row">
            <label className="form-field">
              <span>Weight (lbs)</span>
              <input
                className="text-input mono"
                type="number"
                inputMode="decimal"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Reps</span>
              <input
                className="text-input mono"
                type="number"
                inputMode="numeric"
                min="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </label>
          </div>
          <button className="accent-button" type="submit">
            Log set
          </button>
          <p className="muted small-text" role="status">
            {message || "Sets are saved to today and update your goal progress."}
          </p>
          {customLifts.length > 0 && (
            <div className="custom-lifts">
              <span className="kicker">Your lifts</span>
              <ul>
                {customLifts.map((l) => (
                  <li key={l} className="custom-lift">
                    <span>{l}</span>
                    <button
                      type="button"
                      className="square-button small"
                      onClick={() => gymActions.forgetLift(l)}
                      aria-label={`Remove ${l} from the lift list (keeps its sets and goals)`}
                      title="Remove from the list. Sets and goals stay."
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
