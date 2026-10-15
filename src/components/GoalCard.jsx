import { formatShort } from "../lib/dates.js";
import { convertStyle } from "../lib/goals.js";
import PrioritySelect from "./PrioritySelect.jsx";
import StyleSelect from "./StyleSelect.jsx";

function GoalDescription({ goal, onChange }) {
  if (goal.style === "paragraph") {
    return goal.text ? <p className="goal-paragraph">{goal.text}</p> : null;
  }
  if (goal.style === "bullets") {
    return (
      <ul className="goal-bullets">
        {goal.items.map((item, i) => (
          <li key={i}>{item.text}</li>
        ))}
      </ul>
    );
  }
  // Checklist: done items move to the bottom.
  const order = goal.items.map((item, i) => ({ item, i })).sort((a, b) => a.item.done - b.item.done);
  function toggle(i) {
    onChange({ items: goal.items.map((item, j) => (j === i ? { ...item, done: !item.done } : item)) });
  }
  return (
    <ul className="goal-checklist">
      {order.map(({ item, i }) => (
        <li key={i} className={item.done ? "done" : undefined}>
          <label>
            <input type="checkbox" checked={item.done} onChange={() => toggle(i)} />
            <span className="done-text">
              {item.done && <span className="check">✓ </span>}
              {item.text}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function GoalCard({ goal, actions }) {
  const update = (changes) => actions.update(goal.id, changes);
  return (
    <article className={goal.done ? "goal-card done" : "goal-card"}>
      <header className="goal-header">
        <h3 className="goal-title done-text">{goal.title}</h3>
        <button
          className={goal.done ? "goal-check checked" : "goal-check"}
          onClick={() => update({ done: !goal.done })}
          aria-label={goal.done ? "Mark goal not done" : "Mark goal done"}
        >
          ✓
        </button>
      </header>
      <div className="goal-meta">
        <PrioritySelect value={goal.priority} onChange={(priority) => update({ priority })} />
        {goal.dueDate && <span className="goal-due">Due {formatShort(goal.dueDate)}</span>}
      </div>
      <GoalDescription goal={goal} onChange={update} />
      <footer className="goal-footer">
        <StyleSelect value={goal.style} onChange={(style) => actions.replace(convertStyle(goal, style))} />
        <button className="icon-button" onClick={() => actions.remove(goal.id)} aria-label="Delete goal">
          🗑
        </button>
      </footer>
    </article>
  );
}
