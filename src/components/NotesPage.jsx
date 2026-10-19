import { useState } from "react";
import { formatShort } from "../lib/dates.js";
import { openGoals, accomplishments } from "../lib/goals.js";
import { notesFor, countFor } from "../lib/notes.js";
import PriorityDot from "./PriorityDot.jsx";

// The selection value for general notes (goal ids are UUIDs, so it can't clash).
export const GENERAL = "general";

// Enter saves; Shift+Enter makes a new line (the textarea's own behavior).
function saveOnEnter(e, save) {
  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
    e.preventDefault();
    save();
  }
}

function NoteBox({ onAdd }) {
  const [text, setText] = useState("");
  function save() {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  }
  return (
    <div className="note-box">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => saveOnEnter(e, save)}
        placeholder="Write a note…"
        aria-label="Write a note"
        rows={2}
      />
      <button className="primary blue" onClick={save} disabled={!text.trim()}>
        Save
      </button>
    </div>
  );
}

function Note({ note, actions }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save() {
    actions.edit(note.id, draft);
    setEditing(false);
  }

  return (
    <li className="note">
      <div className="note-head">
        <span className="note-date">{formatShort(note.date)}</span>
        {!editing && !confirmingDelete && (
          <button className="icon-button" onClick={() => setConfirmingDelete(true)} aria-label="Delete note">
            🗑
          </button>
        )}
      </div>
      {editing ? (
        <div className="note-edit">
          <textarea
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
              else saveOnEnter(e, save);
            }}
            aria-label="Edit note"
            rows={3}
          />
          <div className="note-buttons">
            <button onClick={() => setEditing(false)}>Cancel</button>
            <button className="primary blue" onClick={save}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <p
          className="note-text"
          role="button"
          tabIndex={0}
          onClick={() => {
            setDraft(note.text);
            setEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setDraft(note.text);
              setEditing(true);
            }
          }}
        >
          {note.text}
        </p>
      )}
      {confirmingDelete && (
        <div className="note-confirm">
          <span>Delete this note?</span>
          <div className="note-buttons">
            <button onClick={() => setConfirmingDelete(false)}>Cancel</button>
            <button className="danger" onClick={() => actions.remove(note.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Progress({ goal }) {
  const total = goal.items.length;
  if (goal.style !== "checklist" || total === 0) return null;
  const done = goal.items.filter((i) => i.done).length;
  return (
    <div className="notes-progress">
      <div
        className="notes-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Steps done"
      >
        <span style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="notes-progress-text">
        {done} of {total} steps
      </span>
    </div>
  );
}

function Panel({ goal, notes, onAdd, actions, onBack, noGoals }) {
  const list = notesFor(notes, goal ? goal.id : null);
  return (
    <section className="notes-panel">
      {onBack && (
        <button className="notes-back" onClick={onBack}>
          ← Notes
        </button>
      )}
      <header className="notes-panel-header">
        <h1 className="notes-panel-title">{goal ? goal.title : "General notes"}</h1>
        {goal?.dueDate && <span className="notes-due">Due {formatShort(goal.dueDate)}</span>}
      </header>
      {goal && <Progress goal={goal} />}
      {noGoals && (
        <p className="notes-invite">No goals yet. Create one on the Week or Today page to keep notes on it.</p>
      )}
      <NoteBox onAdd={onAdd} />
      {list.length === 0 ? (
        <p className="notes-empty">No notes yet. Write your first one above.</p>
      ) : (
        <ol className="note-timeline">
          {list.map((note) => (
            <Note key={note.id} note={note} actions={actions} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Item({ label, dot, count, current, onClick }) {
  return (
    <button className="notes-item" aria-current={current ? "true" : undefined} onClick={onClick}>
      {dot}
      <span className="notes-item-title">{label}</span>
      {count > 0 && <span className="notes-item-count">{count}</span>}
    </button>
  );
}

// Dated notes per goal, plus general notes.
// selected: a goal id, GENERAL, or null for the default (the first active goal on a laptop,
// the list on a phone). On a phone the list and the chosen panel take turns full screen.
// noteActions: add(text, goalId), edit(id, text), remove(id).
export default function NotesPage({ goals, notes, selected, onSelect, noteActions, isPhone }) {
  const [showFinished, setShowFinished] = useState(false);
  const active = openGoals(goals);
  const finished = accomplishments(goals);

  // A selected goal that no longer exists falls back to the default.
  const selectedGoal = goals.find((g) => g.id === selected) ?? null;
  const choice = selected === GENERAL || selectedGoal ? selected : null;
  const shown = choice ?? (active[0]?.id ?? GENERAL);
  const shownGoal = goals.find((g) => g.id === shown) ?? null;

  const list = (
    <nav className="notes-list" aria-label="Goals">
      {active.map((g) => (
        <Item
          key={g.id}
          label={g.title}
          dot={<PriorityDot priority={g.priority} />}
          count={countFor(notes, g.id)}
          current={!isPhone && shown === g.id}
          onClick={() => onSelect(g.id)}
        />
      ))}
      {finished.length > 0 && (
        <div className="notes-finished">
          <button className="notes-finished-toggle" aria-expanded={showFinished} onClick={() => setShowFinished((v) => !v)}>
            {`Finished (${finished.length})`}
          </button>
          {showFinished &&
            finished.map((g) => (
              <Item
                key={g.id}
                label={g.title}
                dot={<span className="notes-done-mark">✓</span>}
                count={countFor(notes, g.id)}
                current={!isPhone && shown === g.id}
                onClick={() => onSelect(g.id)}
              />
            ))}
        </div>
      )}
      <Item
        label="General notes"
        dot={<span className="notes-general-mark">📝</span>}
        count={countFor(notes, null)}
        current={!isPhone && shown === GENERAL}
        onClick={() => onSelect(GENERAL)}
      />
    </nav>
  );

  const panel = (
    <Panel
      goal={shownGoal}
      notes={notes}
      onAdd={(text) => noteActions.add(text, shownGoal ? shownGoal.id : null)}
      actions={noteActions}
      onBack={isPhone && goals.length > 0 ? () => onSelect(null) : null}
      noGoals={goals.length === 0}
    />
  );

  return (
    <main className={isPhone ? "notes-page phone" : "notes-page"}>
      {isPhone ? (choice === null && goals.length > 0 ? list : panel) : (
        <>
          {list}
          {panel}
        </>
      )}
    </main>
  );
}
