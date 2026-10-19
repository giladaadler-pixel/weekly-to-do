import { useState } from "react";
import { formatDayHeading, weekStart } from "../lib/dates.js";
import { todayItems } from "../lib/today.js";
import { streak, weekDots } from "../lib/streaks.js";
import { weekStats } from "../lib/stats.js";
import { overdueTasks } from "../lib/tasks.js";
import { activeRepeats } from "../lib/repeats.js";
import { openGoals } from "../lib/goals.js";
import DayTaskList from "./DayTaskList.jsx";
import TaskModal from "./TaskModal.jsx";
import OverdueSection from "./OverdueSection.jsx";
import GoalsBand from "./GoalsBand.jsx";

const DOT_LETTERS = ["S", "M", "T", "W", "T", "F"];
const DOT_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DOT_WORDS = { done: "done", missed: "not finished", empty: "no tasks", future: "not yet" };

// Today at a glance: date, streak and count, today's tasks, overdue, goals, and this week.
export default function TodayPage({ state, todayIso, taskActions, repeatActions, goalActions }) {
  const [creating, setCreating] = useState(false);
  const items = todayItems(state, todayIso);
  const done = items.filter((i) => i.done).length;
  const days = streak(state, todayIso);
  const week = weekStats(state, weekStart(todayIso));
  const repeats = activeRepeats(state.repeats, state.goals);

  return (
    <main className="today-page">
      <header className="today-header">
        <h1 className="today-date">{formatDayHeading(todayIso)}</h1>
        {days > 0 && <span className="today-streak">🔥 {days}-day streak</span>}
        <span className="today-count">
          {done} of {items.length} done today
        </span>
      </header>

      <button className="create-button create-task today-create" onClick={() => setCreating(true)}>
        Create new task+
      </button>

      {items.length === 0 ? (
        <p className="today-empty">Nothing planned today. Add a task to get started.</p>
      ) : (
        <DayTaskList
          rows={items}
          date={todayIso}
          taskActions={taskActions}
          repeatActions={repeatActions}
          className="today-list"
        />
      )}

      <OverdueSection
        tasks={overdueTasks(state.tasks, todayIso)}
        repeats={repeats}
        todayIso={todayIso}
        taskActions={taskActions}
        repeatActions={repeatActions}
      />

      <GoalsBand goals={openGoals(state.goals)} notes={state.notes} todayIso={todayIso} goalActions={goalActions} />

      <section className="this-week" aria-label="This week">
        <h2 className="this-week-title">This week</h2>
        <span className="this-week-count">
          {week.done} of {week.total} done
        </span>
        <ol className="week-dots">
          {weekDots(state, todayIso).map((status, i) => (
            <li
              key={i}
              className={`week-dot week-dot-${status}`}
              data-letter={DOT_LETTERS[i]}
              aria-label={`${DOT_DAYS[i]}: ${DOT_WORDS[status]}`}
            />
          ))}
        </ol>
      </section>

      {creating && (
        <TaskModal
          onCancel={() => setCreating(false)}
          onCreate={(text, priority, picked) => {
            taskActions.add(text, todayIso, priority, picked);
            setCreating(false);
          }}
        />
      )}
    </main>
  );
}
