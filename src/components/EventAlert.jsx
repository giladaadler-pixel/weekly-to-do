// One calendar reminder in the stack at the top of the screen. Stays until closed.
export default function EventAlert({ message, onClose }) {
  return (
    <div className="event-alert" role="alert">
      <span aria-hidden="true">🔔</span>
      <span className="event-alert-text">{message}</span>
      <button type="button" className="ghost-button" onClick={onClose} aria-label="Dismiss reminder">
        OK
      </button>
    </div>
  );
}
