const PRIORITY_NAMES = { high: "High", medium: "Medium", low: "Low" };

// Small colored circle for a task or goal's priority, readable by screen readers.
export default function PriorityDot({ priority }) {
  return (
    <span
      className={`priority-dot priority-dot-${priority}`}
      role="img"
      aria-label={`${PRIORITY_NAMES[priority]} priority`}
    />
  );
}
