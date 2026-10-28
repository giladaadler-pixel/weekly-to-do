import { useState } from "react";
import { weekDays, weekStart } from "../lib/dates.js";
import { bestWeight, lastWeight, setsToday, trainedOn } from "../lib/gym.js";
import RestTimer from "./RestTimer.jsx";
import LiftField, { OTHER, resolveLift, useLiftChoice } from "./LiftField.jsx";

// Picked instead of a plan exercise to show the Lift dropdown.
const OTHER_EXERCISE = "__other_exercise__";

// Workout tab: the small stats, then logging a set (the main focus) beside the rest timer.
// With a plan (a session following one that has exercises), its exercises are big buttons
// in plan order, each with today's set count, and the weight starts at the last one logged.
// Logging a set always starts the rest timer.
export default function GymWorkout({ gym, todayIso, options, plan, gymActions, gymSession }) {
  const { logs } = gym;
  const planExercises = plan?.exercises.length ? plan.exercises : null;
  const logLift = useLiftChoice();
  const [chosen, setPicked] = useState(planExercises?.[0] ?? null);
  // If the plan was edited and the chosen exercise left it, fall back to the first one.
  const picked =
    planExercises && chosen !== OTHER_EXERCISE && !planExercises.includes(chosen) ? planExercises[0] : chosen;
  const [weight, setWeight] = useState(() => (picked ? String(lastWeight(logs, picked) ?? "") : ""));
  const [reps, setReps] = useState("");
  const [message, setMessage] = useState("");
  const usingPlan = Boolean(planExercises) && picked !== OTHER_EXERCISE;

  function pick(exercise) {
    setPicked(exercise);
    if (exercise !== OTHER_EXERCISE) setWeight(String(lastWeight(logs, exercise) ?? ""));
  }

  const sessions = weekDays(weekStart(todayIso)).filter((d) => trainedOn(logs, d)).length;
  const bestBench = bestWeight(logs, "Bench press");

  function logSet(e) {
    e.preventDefault();
    const lift = usingPlan ? picked : resolveLift(logLift, gym, e.currentTarget);
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
    // With a plan the weight stays as the last one logged; otherwise the form clears.
    if (!usingPlan) setWeight("");
    setReps("");
    if (!usingPlan && logLift.choice === OTHER) logLift.pick(lift);
    gymSession?.actions.afterSet?.();
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
          {planExercises && (
            <div className="plan-exercises" role="group" aria-label={`${plan.name} exercises`}>
              {planExercises.map((ex) => {
                const n = setsToday(logs, ex, todayIso);
                return (
                  <button
                    key={ex}
                    type="button"
                    className="plan-exercise"
                    aria-pressed={picked === ex}
                    onClick={() => pick(ex)}
                  >
                    {ex} <span className="muted">· {n} {n === 1 ? "set" : "sets"}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="plan-exercise"
                aria-pressed={picked === OTHER_EXERCISE}
                onClick={() => pick(OTHER_EXERCISE)}
              >
                Other exercise…
              </button>
            </div>
          )}
          {!usingPlan && <LiftField field={logLift} options={options} />}
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
            {message || "Sets are saved to today and start the rest timer."}
          </p>
        </form>
        {gymSession && <RestTimer session={gymSession.session} left={gymSession.left} actions={gymSession.actions} />}
      </div>
    </>
  );
}
