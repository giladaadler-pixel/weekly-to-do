import { REMINDER_OPTIONS, cleanReminder, formatReminder } from "../lib/schedule.js";

// "🔔 Notify me" dropdown: No notification, At start time, 5/10/15/30 min, 1h, 2h, 1 day before.
// value: minutes before, or null. onChange(minutes | null).
export default function ReminderSelect({ value, onChange, label = "Notify me" }) {
  const current = cleanReminder(value);
  const options = REMINDER_OPTIONS.some((o) => o.value === current)
    ? REMINDER_OPTIONS
    : [...REMINDER_OPTIONS, { value: current, label: formatReminder(current) }];
  return (
    <label className="form-field reminder-field">
      <span>🔔 {label}</span>
      <select
        className="text-input reminder-select"
        value={current === null ? "none" : String(current)}
        onChange={(e) => onChange(e.target.value === "none" ? null : Number(e.target.value))}
      >
        {options.map((o) => (
          <option key={o.label} value={o.value === null ? "none" : String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
