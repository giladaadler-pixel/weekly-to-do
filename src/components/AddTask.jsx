import { useState } from "react";

export default function AddTask({ onAdd }) {
  const [text, setText] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    onAdd(text);
    setText("");
  }

  return (
    <form className="add-task" onSubmit={onSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New task"
        aria-label="New task"
      />
      <button type="submit">Add</button>
    </form>
  );
}
