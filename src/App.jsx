import { useEffect, useState } from "react";
import "./App.css";
import { todayISO, weekStart, addDays } from "./lib/dates.js";
import { loadState, saveState } from "./lib/storage.js";
import { makeTask, updateTask, deleteTask, editText, moveTask } from "./lib/tasks.js";
import {
  makeRepeat,
  toggleDoneOn,
  makeUpOne,
  clearAll,
  deleteOne,
  deleteFuture,
  activeRepeats,
} from "./lib/repeats.js";
import { makeGoal, updateGoal, makeGoalRepeat, deleteGoalAndRepeats } from "./lib/goals.js";
import WeekView from "./components/WeekView.jsx";
import { weekStats } from "./lib/stats.js";
import TopBar from "./components/TopBar.jsx";
import GoalsPage from "./components/GoalsPage.jsx";

export default function App() {
  const [state, setState] = useState(() => loadState());
  const todayIso = todayISO();
  // The Sunday of the week being viewed. Not saved: the app always opens on this week.
  const [viewWeek, setViewWeek] = useState(() => weekStart(todayIso));
  // "week" | "goals". Not saved.
  const [page, setPage] = useState("week");

  useEffect(() => {
    saveState(state);
  }, [state]);

  function setTasks(change) {
    setState((s) => ({ ...s, tasks: change(s.tasks) }));
  }

  function setRepeat(id, change) {
    setState((s) => ({ ...s, repeats: s.repeats.map((r) => (r.id === id ? change(r) : r)) }));
  }

  const taskActions = {
    // With days picked, adds a repeating task starting on this date instead.
    add: (text, date, priority, days = []) => {
      if (days.length > 0) {
        const repeat = makeRepeat({ text, days, priority, startDate: date });
        if (repeat) setState((s) => ({ ...s, repeats: [...s.repeats, repeat] }));
        return;
      }
      const task = makeTask(text, date, priority);
      if (task) setTasks((tasks) => [...tasks, task]);
    },
    toggle: (id, done) => setTasks((tasks) => updateTask(tasks, id, { done })),
    setPriority: (id, priority) => setTasks((tasks) => updateTask(tasks, id, { priority })),
    edit: (id, text) => setTasks((tasks) => editText(tasks, id, text)),
    move: (id, date) => setTasks((tasks) => moveTask(tasks, id, date)),
    remove: (id) => setTasks((tasks) => deleteTask(tasks, id)),
  };

  const repeatActions = {
    toggle: (id, date) => setRepeat(id, (r) => toggleDoneOn(r, date)),
    setPriority: (id, priority) => setRepeat(id, (r) => ({ ...r, priority })),
    edit: (id, text) => setRepeat(id, (r) => (text.trim() ? { ...r, text: text.trim() } : r)),
    deleteOne: (id, date) => setRepeat(id, (r) => deleteOne(r, date)),
    deleteFuture: (id, date) => setRepeat(id, (r) => deleteFuture(r, date)),
    makeUp: (id) => setRepeat(id, (r) => makeUpOne(r, todayIso)),
    clearAll: (id) => setRepeat(id, (r) => clearAll(r, todayIso)),
  };

  function setGoals(change) {
    setState((s) => ({ ...s, goals: change(s.goals) }));
  }

  const goalActions = {
    // fields.days ("Show on days") also adds a 🎯 repeat for the goal.
    create: ({ days = [], ...fields }) => {
      const goal = makeGoal(fields, todayIso);
      if (!goal) return;
      const repeat = makeGoalRepeat(goal, days, todayIso);
      setState((s) => ({
        ...s,
        goals: [...s.goals, goal],
        repeats: repeat ? [...s.repeats, repeat] : s.repeats,
      }));
    },
    update: (id, changes) => setGoals((goals) => updateGoal(goals, id, changes)),
    replace: (goal) => setGoals((goals) => updateGoal(goals, goal.id, goal)),
    remove: (id) => setState((s) => deleteGoalAndRepeats(s, id)),
  };

  return (
    <>
      <TopBar
        page={page}
        onPage={setPage}
        viewWeek={viewWeek}
        onPrev={() => setViewWeek((w) => addDays(w, -7))}
        onNext={() => setViewWeek((w) => addDays(w, 7))}
        stats={weekStats(state, viewWeek)}
      />
      {page === "goals" ? (
        <GoalsPage goals={state.goals} todayIso={todayIso} goalActions={goalActions} />
      ) : (
        <WeekView
          weekStartIso={viewWeek}
          todayIso={todayIso}
          tasks={state.tasks}
          repeats={activeRepeats(state.repeats, state.goals)}
          goals={state.goals}
          taskActions={taskActions}
          repeatActions={repeatActions}
          goalActions={goalActions}
        />
      )}
    </>
  );
}
