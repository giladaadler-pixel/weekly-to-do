const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Checkboxes Sun–Sat. days = picked weekday numbers (0 = Sun … 6 = Sat).
export default function DayPicker({ days, onChange }) {
  function toggle(n) {
    onChange(days.includes(n) ? days.filter((d) => d !== n) : [...days, n].sort());
  }

  return (
    <div className="day-picker">
      {DAYS.map((label, n) => (
        <label key={label}>
          <input type="checkbox" checked={days.includes(n)} onChange={() => toggle(n)} />
          {label}
        </label>
      ))}
    </div>
  );
}
