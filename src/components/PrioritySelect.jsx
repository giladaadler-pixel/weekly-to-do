export default function PrioritySelect({ value, onChange, className = "" }) {
  return (
    <select
      className={`priority priority-${value} ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Priority"
    >
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
}
