import { useState } from "react";
import { liftOptions } from "../lib/gym.js";
import GymTabs, { loadTab, saveTab } from "./GymTabs.jsx";
import GymWorkout from "./GymWorkout.jsx";
import GymPlans from "./GymPlans.jsx";
import GymExercises from "./GymExercises.jsx";
import GymHistory from "./GymHistory.jsx";
import PlanChooser from "./PlanChooser.jsx";

const TABS = [
  { id: "workout", label: "Workout" },
  { id: "plans", label: "Plans" },
  { id: "exercises", label: "Exercises" },
  { id: "history", label: "History" },
];

// The Gym page: a header with the session button, then tabs — Workout (log a set and the
// rest timer), Plans (your workout plans), Exercises (your exercise list) and History
// (strength goals and set history).
// Starting a session also shows the rest timer on the Week page.
// gymActions: { addLog({ lift, weight, reps }), removeLog(id), addLift({ lift, target, due }), removeLift(id),
//   addExercise(name), forgetLift(name), savePlan({ id?, name, exercises }), deletePlan(id) }
// gymSession: { session, left, actions } from useGymSession
// onToast(message): the "Push day done — 9 sets" message when a session ends.
export default function GymPage({ gym, todayIso, gymActions, gymSession, onToast }) {
  const ids = TABS.map((t) => t.id);
  const [tab, setTab] = useState(() => loadTab(ids));
  const [choosing, setChoosing] = useState(false);
  const options = liftOptions(gym);
  const session = gymSession?.session;
  const active = Boolean(session?.active);
  // A session whose plan was deleted carries on as No plan.
  const plan = active ? (gym.plans.find((p) => p.id === session.planId) ?? null) : null;

  function changeTab(id) {
    setTab(id);
    saveTab(id);
  }

  function startWith(planId) {
    gymSession.actions.startSession(planId);
    setChoosing(false);
    changeTab("workout");
  }

  function onStartClick() {
    if (gym.plans.length) setChoosing(true);
    else startWith(null);
  }

  function onEnd() {
    const n = session.setsLogged;
    if (n > 0) onToast?.(`${plan ? plan.name : "Gym session"} done — ${n} ${n === 1 ? "set" : "sets"}`);
    gymSession.actions.endSession();
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
            onClick={active ? onEnd : onStartClick}
          >
            {active ? "End session" : "Start gym session"}
          </button>
        )}
      </header>
      {active && (
        <p className="muted small-text gym-session-note">
          <strong className="accent">{plan ? `${plan.name} · session on` : "Session on"}</strong> — the rest timer
          also shows on your Week page.
        </p>
      )}

      <GymTabs tabs={TABS} current={tab} onChange={changeTab} />

      <div className="gym-panel" role="tabpanel" id={`gym-panel-${tab}`} aria-labelledby={`gym-tab-${tab}`}>
        {tab === "workout" && (
          <GymWorkout
            key={plan?.id ?? "no-plan"}
            plan={plan}
            gym={gym}
            todayIso={todayIso}
            options={options}
            gymActions={gymActions}
            gymSession={gymSession}
          />
        )}
        {tab === "plans" && (
          <GymPlans gym={gym} gymActions={gymActions} onStart={gymSession && ((p) => startWith(p.id))} />
        )}
        {tab === "exercises" && <GymExercises gym={gym} gymActions={gymActions} />}
        {tab === "history" && <GymHistory gym={gym} options={options} gymActions={gymActions} />}
      </div>
      {choosing && <PlanChooser plans={gym.plans} onPick={startWith} onClose={() => setChoosing(false)} />}
    </main>
  );
}
