import { useState } from "react";
import PrioritySelect from "./PrioritySelect.jsx";
import DayPicker from "./DayPicker.jsx";

// days: picked weekdays (0 = Sun … 6 = Sat). Empty = a one-off task.
export default function AddTask({ onAdd }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [days, setDays] = useState([]);
  const [showDays, setShowDays] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    onAdd(text, priority, days);
    setText("");
    setPriority("medium");
    setDays([]);
    setShowDays(false);
  }

  return (
    <form className="add-task" onSubmit={onSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New task"
        aria-label="New task"
      />
      <PrioritySelect value={priority} onChange={setPriority} />
      <button
        type="button"
        className={showDays || days.length ? "icon-button active" : "icon-button"}
        onClick={() => setShowDays((v) => !v)}
        aria-label="Repeat on days"
        title="Repeat on days"
      >
        🔁
      </button>
      <button type="submit">Add</button>
      {showDays && <DayPicker days={days} onChange={setDays} />}
    </form>
  );
}
