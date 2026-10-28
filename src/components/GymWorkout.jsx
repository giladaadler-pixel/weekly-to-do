import { useState } from "react";
import { weekDays, weekStart } from "../lib/dates.js";
import { bestWeight, trainedOn } from "../lib/gym.js";
import RestTimer from "./RestTimer.jsx";
import LiftField, { OTHER, resolveLift, useLiftChoice } from "./LiftField.jsx";

// Workout tab: the small stats, then logging a set (the main focus) beside the rest timer.
export default function GymWorkout({ gym, todayIso, options, gymActions, gymSession }) {
  const logLift = useLiftChoice();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [message, setMessage] = useState("");

  const { logs } = gym;
  const sessions = weekDays(weekStart(todayIso)).filter((d) => trainedOn(logs, d)).length;
  const bestBench = bestWeight(logs, "Bench press");

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
    setMessage(
      Number(weight) > before ? `New PR — ${lift} ${Number(weight)} lbs` : `Logged ${lift} ${weight} × ${reps}`,
    );
    setWeight("");
    setReps("");
    if (logLift.choice === OTHER) logLift.pick(lift);
  }

  return (
    <>
      <div className="stat-row">
        <div className="stat-mini">
          <span className="kicker">Sessions this week</span>
          <span className="stat-value accent mono">{sessions}</span>
        </div>
        <div className="stat-mini">
          <span className="kicker">Best bench</span>
          <span className="stat-value mono">{bestBench ? `${bestBench} lbs` : "—"}</span>
        </div>
        <div className="stat-mini">
          <span className="kicker">Sets logged</span>
          <span className="stat-value mono">{logs.length}</span>
        </div>
      </div>

      <div className="gym-focus">
        <form className="panel glow-panel log-form gym-log" onSubmit={logSet}>
          <h2 className="gym-log-title">Log a set</h2>
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
        </form>
        {gymSession && <RestTimer session={gymSession.session} left={gymSession.left} actions={gymSession.actions} />}
      </div>
    </>
  );
}
