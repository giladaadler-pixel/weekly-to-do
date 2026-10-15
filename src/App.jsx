import { useEffect, useState } from "react";
import "./App.css";
import { todayISO, weekStart, addDays } from "./lib/dates.js";
import { loadState, saveState } from "./lib/storage.js";
import { makeTask, updateTask, deleteTask, editText, moveTask } from "./lib/tasks.js";
import WeekView from "./components/WeekView.jsx";
import TopBar from "./components/TopBar.jsx";

export default function App() {
  const [state, setState] = useState(() => loadState());
  const todayIso = todayISO();
  // The Sunday of the week being viewed. Not saved: the app always opens on this week.
  const [viewWeek, setViewWeek] = useState(() => weekStart(todayIso));

  useEffect(() => {
    saveState(state);
  }, [state]);

  function setTasks(change) {
    setState((s) => ({ ...s, tasks: change(s.tasks) }));
  }

  const taskActions = {
    add: (text, date, priority) => {
      const task = makeTask(text, date, priority);
      if (task) setTasks((tasks) => [...tasks, task]);
    },
    toggle: (id, done) => setTasks((tasks) => updateTask(tasks, id, { done })),
    setPriority: (id, priority) => setTasks((tasks) => updateTask(tasks, id, { priority })),
    edit: (id, text) => setTasks((tasks) => editText(tasks, id, text)),
    move: (id, date) => setTasks((tasks) => moveTask(tasks, id, date)),
    remove: (id) => setTasks((tasks) => deleteTask(tasks, id)),
  };

  return (
    <>
      <TopBar
        viewWeek={viewWeek}
        onPrev={() => setViewWeek((w) => addDays(w, -7))}
        onNext={() => setViewWeek((w) => addDays(w, 7))}
      />
      <WeekView
        weekStartIso={viewWeek}
        todayIso={todayIso}
        tasks={state.tasks}
        taskActions={taskActions}
      />
    </>
  );
}
