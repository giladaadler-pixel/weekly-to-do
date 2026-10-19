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
import { makeGoal, updateGoal, setGoalDone, makeGoalRepeat, deleteGoalAndRepeats } from "./lib/goals.js";
import WeekView from "./components/WeekView.jsx";
import { weekStats } from "./lib/stats.js";
import TopBar from "./components/TopBar.jsx";
import AccomplishmentsPage from "./components/AccomplishmentsPage.jsx";
import Sidebar from "./components/Sidebar.jsx";

const PHONE_QUERY = "(max-width: 700px)";

// True on screens 700px wide or narrower. Follows the window as it resizes.
function useIsPhone() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia?.(PHONE_QUERY).matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.(PHONE_QUERY);
    if (!query) return;
    const update = () => setIsPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isPhone;
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const todayIso = todayISO();
  // The Sunday of the week being viewed. Not saved: the app always opens on this week.
  const [viewWeek, setViewWeek] = useState(() => weekStart(todayIso));
  // "week" | "accomplishments". Not saved.
  const [page, setPage] = useState("week");
  const isPhone = useIsPhone();
  // Phone only: whether ☰ has slid the sidebar in. Not saved.
  const [phoneOpen, setPhoneOpen] = useState(false);
  const pinned = state.ui.sidebarPinned;

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  // Tells the CSS how much room to leave on the right for the sidebar.
  useEffect(() => {
    document.documentElement.dataset.sidebar = isPhone ? "phone" : pinned ? "pinned" : "tucked";
  }, [isPhone, pinned]);

  function setPinned(sidebarPinned) {
    setState((s) => ({ ...s, ui: { ...s.ui, sidebarPinned } }));
  }

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
    setDone: (id, done) => setGoals((goals) => setGoalDone(goals, id, done)),
    replace: (goal) => setGoals((goals) => updateGoal(goals, goal.id, goal)),
    remove: (id) => setState((s) => deleteGoalAndRepeats(s, id)),
  };

  return (
    <>
      <TopBar
        page={page}
        viewWeek={viewWeek}
        onPrev={() => setViewWeek((w) => addDays(w, -7))}
        onNext={() => setViewWeek((w) => addDays(w, 7))}
        onToday={() => setViewWeek(weekStart(todayIso))}
        isCurrentWeek={viewWeek === weekStart(todayIso)}
        stats={weekStats(state, viewWeek)}
        theme={state.theme}
        onToggleTheme={() => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))}
      />
      {page === "accomplishments" ? (
        <AccomplishmentsPage goals={state.goals} onMarkNotDone={(id) => goalActions.setDone(id, false)} />
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
      <Sidebar
        page={page}
        onPage={setPage}
        pinned={pinned}
        onPin={() => setPinned(true)}
        onTuck={() => setPinned(false)}
        isPhone={isPhone}
        phoneOpen={phoneOpen}
        onPhoneOpen={() => setPhoneOpen(true)}
        onPhoneClose={() => setPhoneOpen(false)}
      />
    </>
  );
}
