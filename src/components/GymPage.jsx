import { useState } from "react";
import { liftOptions } from "../lib/gym.js";
import GymTabs, { loadTab, saveTab } from "./GymTabs.jsx";
import GymWorkout from "./GymWorkout.jsx";
import GymExercises from "./GymExercises.jsx";
import GymHistory from "./GymHistory.jsx";

const TABS = [
  { id: "workout", label: "Workout" },
  { id: "exercises", label: "Exercises" },
  { id: "history", label: "History" },
];

// The Gym page: a header with the session button, then tabs — Workout (log a set and the
// rest timer), Exercises (your exercise list) and History (strength goals and set history).
// Starting a session also shows the rest timer on the Week page.
// gymActions: { addLog({ lift, weight, reps }), removeLog(id), addLift({ lift, target, due }), removeLift(id),
//   addExercise(name), forgetLift(name) }
// gymSession: { session, left, actions } from useGymSession
export default function GymPage({ gym, todayIso, gymActions, gymSession }) {
  const ids = TABS.map((t) => t.id);
  const [tab, setTab] = useState(() => loadTab(ids));
  const options = liftOptions(gym);
  const active = Boolean(gymSession?.session.active);

  function changeTab(id) {
    setTab(id);
    saveTab(id);
  }

  return (
    <main className="gym-page">
      <header className="page-header gym-header">
        <div>
          <span className="kicker">Training</span>
          <h1>Gym tracker</h1>
        </div>
        {gymSession && (
          <button
            type="button"
            className={active ? "ghost-button bordered" : "accent-button"}
            onClick={active ? gymSession.actions.endSession : gymSession.actions.startSession}
          >
            {active ? "End session" : "Start gym session"}
          </button>
        )}
      </header>
      {active && (
        <p className="muted small-text gym-session-note">Session on — the rest timer also shows on your Week page.</p>
      )}

      <GymTabs tabs={TABS} current={tab} onChange={changeTab} />

      <div className="gym-panel" role="tabpanel" id={`gym-panel-${tab}`} aria-labelledby={`gym-tab-${tab}`}>
        {tab === "workout" && (
          <GymWorkout
            gym={gym}
            todayIso={todayIso}
            options={options}
            gymActions={gymActions}
            gymSession={gymSession}
          />
        )}
        {tab === "exercises" && <GymExercises gym={gym} gymActions={gymActions} />}
        {tab === "history" && <GymHistory gym={gym} options={options} gymActions={gymActions} />}
      </div>
    </main>
  );
}
