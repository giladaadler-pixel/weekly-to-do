import { useState } from "react";
import PrioritySelect from "./PrioritySelect.jsx";

export default function AddTask({ onAdd }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");

  function onSubmit(e) {
    e.preventDefault();
    onAdd(text, priority);
    setText("");
    setPriority("medium");
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
      <button type="submit">Add</button>
    </form>
  );
}
