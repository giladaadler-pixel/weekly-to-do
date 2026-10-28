import { useCallback, useEffect, useRef, useState } from "react";
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
import { exportBackup, parseBackup, backupFileName } from "./lib/backup.js";
import { downloadFile } from "./lib/download.js";
import { makeNote, editNote, deleteNote } from "./lib/notes.js";
import NotesPage from "./components/NotesPage.jsx";
import ReminderModal from "./components/ReminderModal.jsx";
import { todayCounts } from "./lib/today.js";
import { updateBadge } from "./lib/badge.js";
import { makeEvent, deleteEvent } from "./lib/schedule.js";
import { gymOf, makeLog, makeLiftGoal } from "./lib/gym.js";
import DayPage from "./components/DayPage.jsx";
import GymPage from "./components/GymPage.jsx";
import Toast from "./components/Toast.jsx";
import { streak } from "./lib/streaks.js";

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

// Today's unfinished tasks: the number on the home-screen icon.
function unfinishedToday(state, iso) {
  const { done, total } = todayCounts(state, iso);
  return total - done;
}

// "unsupported" | "default" | "granted" | "denied"
function notificationPermission() {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  // Re-render when the app comes back into view, so "today" is right after midnight.
  const [, setShownAt] = useState(0);
  const todayIso = todayISO();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [badgePermission, setBadgePermission] = useState(notificationPermission);
  const [reminderOpen, setReminderOpen] = useState(false);
  // { id, message } for the toast at the bottom, or null. Not saved.
  const [toast, setToast] = useState(null);
  // The Sunday of the week being viewed. Not saved: the app always opens on this week.
  const [viewWeek, setViewWeek] = useState(() => weekStart(todayIso));
  // "week" | "day" | "gym" | "accomplishments" | "notes". Not saved: the app always opens on Week.
  const [page, setPage] = useState("week");
  // Notes page selection: a goal id, "general", or null for its default. Not saved.
  const [notesSelected, setNotesSelected] = useState(null);
  // The date shown on the day (hourly schedule) page. Not saved.
  const [dayDate, setDayDate] = useState(todayIso);
  const isPhone = useIsPhone();
  // Phone only: whether ☰ has slid the sidebar in. Not saved.
  const [phoneOpen, setPhoneOpen] = useState(false);
  const pinned = state.ui.sidebarPinned;

  useEffect(() => {
    updateBadge(unfinishedToday(state, todayIso));
  }, [state, todayIso]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      setShownAt(Date.now());
      updateBadge(unfinishedToday(stateRef.current, todayISO()));
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Re-render just after midnight too, so past days grey out while the app stays open.
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => setShownAt(Date.now()), midnight - now + 1000);
    return () => clearTimeout(timer);
  }, [todayIso]);

  // 🔔 Enable badge: iPhone only shows badges once notifications are allowed.
  async function enableBadge() {
    try {
      const permission = await Notification.requestPermission();
      setBadgePermission(permission);
      if (permission === "granted") updateBadge(unfinishedToday(stateRef.current, todayISO()));
    } catch {
      setBadgePermission(notificationPermission());
    }
  }

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  // Tells the CSS how much room to leave on the left for the sidebar.
  useEffect(() => {
    document.documentElement.dataset.sidebar = isPhone ? "phone" : pinned ? "pinned" : "tucked";
  }, [isPhone, pinned]);

  function setPinned(sidebarPinned) {
    setState((s) => ({ ...s, ui: { ...s.ui, sidebarPinned } }));
  }

  const closeToast = useCallback(() => setToast(null), []);

  function showToast(message) {
    setToast({ id: Date.now(), message });
  }

  function downloadBackup() {
    downloadFile(exportBackup(state), backupFileName(todayIso), "application/json");
    showToast("Backup downloaded");
  }

  async function importBackup(file) {
    const backup = parseBackup(await file.text());
    if (!backup) {
      showToast("That file isn't a Weekly To-Do backup");
      return;
    }
    if (window.confirm("Replace everything on this device with this backup?")) {
      setState(backup);
      showToast("Backup restored");
    }
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
    openNotes: (id) => openNotes(id),
  };

  function openNotes(goalId) {
    setNotesSelected(goalId);
    setPage("notes");
  }

  function setNotes(change) {
    setState((s) => ({ ...s, notes: change(s.notes) }));
  }

  const noteActions = {
    add: (text, goalId) => {
      const note = makeNote(text, goalId, todayIso);
      if (note) setNotes((notes) => [...notes, note]);
    },
    edit: (id, text) => setNotes((notes) => editNote(notes, id, text)),
    remove: (id) => setNotes((notes) => deleteNote(notes, id)),
  };

  function openDay(date) {
    setDayDate(date);
    setPage("day");
  }

  const eventActions = {
    add: (fields) => {
      const event = makeEvent(fields);
      if (event) setState((s) => ({ ...s, events: [...(s.events ?? []), event] }));
    },
    remove: (id) => setState((s) => ({ ...s, events: deleteEvent(s.events ?? [], id) })),
  };

  function setGym(change) {
    setState((s) => ({ ...s, gym: change(gymOf(s)) }));
  }

  // addLog and addLift return false when the input isn't valid, so the page can say so.
  const gymActions = {
    addLog: (fields) => {
      const log = makeLog({ ...fields, date: todayIso });
      if (!log) return false;
      setGym((g) => ({ ...g, logs: [...g.logs, log] }));
      return true;
    },
    removeLog: (id) => setGym((g) => ({ ...g, logs: g.logs.filter((l) => l.id !== id) })),
    addLift: (fields) => {
      const goal = makeLiftGoal(fields);
      if (!goal) return false;
      setGym((g) => ({ ...g, lifts: [...g.lifts, goal] }));
      return true;
    },
    removeLift: (id) => setGym((g) => ({ ...g, lifts: g.lifts.filter((l) => l.id !== id) })),
  };

  // From the sidebar, Notes opens on its default selection.
  function goToPage(next) {
    if (next === "notes") setNotesSelected(null);
    setPage(next);
  }

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
      {page === "day" ? (
        <DayPage
          date={dayDate}
          todayIso={todayIso}
          tasks={state.tasks}
          repeats={activeRepeats(state.repeats, state.goals)}
          events={state.events ?? []}
          streakDays={streak(state, todayIso)}
          taskActions={taskActions}
          repeatActions={repeatActions}
          eventActions={eventActions}
          onDate={setDayDate}
          onBack={() => {
            setViewWeek(weekStart(dayDate));
            setPage("week");
          }}
        />
      ) : page === "gym" ? (
        <GymPage gym={gymOf(state)} todayIso={todayIso} gymActions={gymActions} onOpenDay={openDay} />
      ) : page === "notes" ? (
        <NotesPage
          goals={state.goals}
          notes={state.notes}
          selected={notesSelected}
          onSelect={setNotesSelected}
          noteActions={noteActions}
          isPhone={isPhone}
        />
      ) : page === "accomplishments" ? (
        <AccomplishmentsPage
          goals={state.goals}
          notes={state.notes}
          onMarkNotDone={(id) => goalActions.setDone(id, false)}
          onOpenNotes={openNotes}
        />
      ) : (
        <WeekView
          weekStartIso={viewWeek}
          todayIso={todayIso}
          tasks={state.tasks}
          repeats={activeRepeats(state.repeats, state.goals)}
          goals={state.goals}
          notes={state.notes}
          taskActions={taskActions}
          repeatActions={repeatActions}
          goalActions={goalActions}
          onOpenDay={openDay}
        />
      )}
      <Sidebar
        page={page}
        onPage={goToPage}
        pinned={pinned}
        onPin={() => setPinned(true)}
        onTuck={() => setPinned(false)}
        isPhone={isPhone}
        phoneOpen={phoneOpen}
        onPhoneOpen={() => setPhoneOpen(true)}
        onPhoneClose={() => setPhoneOpen(false)}
        onExport={downloadBackup}
        onImport={importBackup}
        onReminder={() => setReminderOpen(true)}
        onEnableBadge={enableBadge}
        badgePermission={badgePermission}
        reminderTime={state.settings.reminderTime}
      />
      {reminderOpen && (
        <ReminderModal
          time={state.settings.reminderTime}
          todayIso={todayIso}
          standalone={Boolean(window.navigator.standalone)}
          onSave={(reminderTime) => setState((s) => ({ ...s, settings: { ...s.settings, reminderTime } }))}
          onClose={() => setReminderOpen(false)}
        />
      )}
      {toast && <Toast key={toast.id} message={toast.message} onDone={closeToast} />}
    </>
  );
}
