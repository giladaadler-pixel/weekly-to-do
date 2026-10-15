import { useEffect, useState } from "react";
import "./App.css";
import { todayISO, weekStart } from "./lib/dates.js";
import { loadState, saveState } from "./lib/storage.js";
import { makeTask, updateTask, deleteTask, editText } from "./lib/tasks.js";
import WeekView from "./components/WeekView.jsx";

export default function App() {
  const [state, setState] = useState(() => loadState());
  const todayIso = todayISO();

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
    remove: (id) => setTasks((tasks) => deleteTask(tasks, id)),
  };

  return (
    <>
      <h1>My Week</h1>
      <WeekView
        weekStartIso={weekStart(todayIso)}
        todayIso={todayIso}
        tasks={state.tasks}
        taskActions={taskActions}
      />
    </>
  );
}
