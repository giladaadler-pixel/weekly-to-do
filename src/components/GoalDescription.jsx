// A goal's description in its style: paragraph, bullets, or a checklist you can tick.
// onChange(changes) is called with the updated items when a checklist item is ticked.
export default function GoalDescription({ goal, onChange }) {
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
