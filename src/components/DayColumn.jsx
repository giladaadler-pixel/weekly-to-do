import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { dayLabel } from "../lib/dates.js";
import { dayRows } from "../lib/today.js";
import { missedDates } from "../lib/repeats.js";
import { DENSITIES, nextDensity } from "../lib/density.js";
import DayTaskList from "./DayTaskList.jsx";
import TaskModal from "./TaskModal.jsx";
import OverdueSection from "./OverdueSection.jsx";

const PHONE_QUERY = "(max-width: 700px)";

// How many of the list's rows fit fully inside the body, from the top.
function rowsThatFit(body) {
  const list = body.querySelector(".day-body-inner > .task-list");
  if (!list) return 0;
  body.scrollTop = 0;
  const top = body.getBoundingClientRect().top;
  let count = 0;
  for (const row of list.children) {
    if (row.getBoundingClientRect().bottom - top > body.clientHeight) break;
    count++;
  }
  return count;
}

export default function DayColumn({ date, isToday, isPast, tasks, repeats, overdue, taskActions, repeatActions, onOpenDay }) {
  const [dropTarget, setDropTarget] = useState(false);
  const [creating, setCreating] = useState(false);
  // Fit-to-box density (see lib/density.js). Not saved: re-worked out from the layout.
  const [density, setDensity] = useState("normal");
  // When clipped: how many list rows fit, or null while that's being measured.
  const [limit, setLimit] = useState(null);
  // Tight boxes fold finished tasks into "✓ N done"; clicking it shows them again until reload.
  const [showDone, setShowDone] = useState(false);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);
  // Content height last measured at each roomier level, so the box knows when it can go back.
  const roomierHeights = useRef({});
  const lastAvailable = useRef(null);
  const lastContentKey = useRef(null);
  const densityRef = useRef(density);
  densityRef.current = density;
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const dayNumber = Number(date.slice(8));
  const className = ["day", isToday && "today", isPast && "day--past", !isToday && !isPast && "day--upcoming", dropTarget && "drop-target"].filter(Boolean).join(" ");

  const rows = dayRows(tasks, repeats, date);
  const clipped = density === "clipped";
  const fold = (density === "tight" || clipped) && !showDone;
  const listRows = fold ? rows.filter((r) => !r.done) : rows;
  const doneCount = rows.length - listRows.length;
  const overdueCount = isToday
    ? overdue.length + repeats.filter((r) => missedDates(r, date).length > 0).length
    : 0;
  const shownRows = clipped && limit !== null ? listRows.slice(0, limit) : listRows;
  const foldShown = doneCount > 0 && (!clipped || limit === null || limit > listRows.length);
  const hiddenCount = clipped && limit !== null
    ? listRows.length - shownRows.length + (doneCount > 0 && !foldShown ? doneCount : 0) + overdueCount
    : 0;
  // Anything that changes the box's content sends it back to "normal" to fit again.
  const contentKey = `${rows.map((r) => `${r.id}:${r.done}`).join(",")}|${overdueCount}|${showDone}`;

  // Measures the box and steps its density one level; each step re-renders and checks again,
  // all before the browser paints.
  function fit() {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return;
    const level = densityRef.current;
    if (window.matchMedia?.(PHONE_QUERY).matches) {
      // Phones: the box grows to fit, so it never needs packing.
      if (level !== "normal") {
        roomierHeights.current = {};
        setLimit(null);
        setDensity("normal");
      }
      return;
    }
    const available = body.clientHeight;
    if (level === "clipped" && limitRef.current === null) {
      lastAvailable.current = available;
      setLimit(rowsThatFit(body));
      return;
    }
    const i = DENSITIES.indexOf(level);
    const contentHeight = inner.offsetHeight;
    const next = nextDensity({
      level,
      contentHeight,
      available,
      roomierHeight: i > 0 ? (roomierHeights.current[DENSITIES[i - 1]] ?? null) : null,
    });
    if (next !== level) {
      if (DENSITIES.indexOf(next) > i) roomierHeights.current[level] = contentHeight;
      setLimit(null);
      setDensity(next);
    } else if (level === "clipped" && available !== lastAvailable.current) {
      // Still clipped, but the box changed size: count the rows that fit again.
      setLimit(null);
    }
  }

  useLayoutEffect(() => {
    if (lastContentKey.current !== contentKey) {
      lastContentKey.current = contentKey;
      roomierHeights.current = {};
      if (densityRef.current !== "normal" || limitRef.current !== null) {
        setLimit(null);
        setDensity("normal");
        return;
      }
    }
    fit();
  });

  // The box changes size with the window (and the goals band above the week).
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(body);
    return () => observer.disconnect();
  }, []); // fit reads everything it needs from refs

  // Tapping the box itself (not a task, button or the add-task popup) opens the day calendar.
  function onBoxClick(e) {
    if (e.target.closest("button, input, select, textarea, label, a, li, .modal-backdrop")) return;
    onOpenDay?.(date);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropTarget(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) taskActions.move(id, date);
  }

  return (
    <section
      className={className}
      data-density={clipped ? "tight" : density}
      data-clipped={clipped || undefined}
      onClick={onBoxClick}
      onDragOver={(e) => {
        e.preventDefault();
        setDropTarget(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(false);
      }}
      onDrop={onDrop}
    >
      <div className="day-header">
        <h2 className="day-title">
          <button className="day-open" onClick={() => onOpenDay?.(date)} title="Open this day's schedule">
            <span className="day-label">{dayLabel(date)}</span> <span className="day-number">{dayNumber}</span>
            {isToday && <span className="today-tag">Today</span>}
            {isPast && <span className="visually-hidden"> (past)</span>}
            <span className="day-open-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        </h2>
        <button className="create-button create-task" onClick={() => setCreating(true)}>
          + Add task
        </button>
      </div>
      <div className="day-body" ref={bodyRef}>
        <div className="day-body-inner" ref={innerRef}>
          <DayTaskList rows={shownRows} date={date} taskActions={taskActions} repeatActions={repeatActions} draggable>
            {fold && foldShown && (
              <li className="task fold-row">
                <button className="fold-button" onClick={() => setShowDone(true)} aria-label={`Show ${doneCount} done`}>
                  ✓ {doneCount} done
                </button>
              </li>
            )}
          </DayTaskList>
          {isToday && !clipped && (
            <OverdueSection
              tasks={overdue}
              repeats={repeats}
              todayIso={date}
              taskActions={taskActions}
              repeatActions={repeatActions}
            />
          )}
        </div>
      </div>
      {clipped && (
        <button className="more-button" onClick={() => onOpenDay?.(date)}>
          {hiddenCount > 0 ? `+${hiddenCount} more` : "Open day"}
        </button>
      )}
      {creating && (
        <TaskModal
          onCancel={() => setCreating(false)}
          onCreate={(text, priority, days) => {
            taskActions.add(text, date, priority, days);
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
