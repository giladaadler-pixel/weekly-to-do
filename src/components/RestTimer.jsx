import { REST_PRESETS, MIN_REST, MAX_REST, formatClock, isRunning, isPaused } from "../lib/restTimer.js";

// Rest timer between sets. Full size on the Gym page; `compact` is the strip shown on
// the Week page while a gym session is on.
// actions: { start, pause, reset, setDuration(secs) }
// title: the session's plan name for the Week strip ("Push day · 1:12").
export default function RestTimer({ session, left, actions, compact = false, onOpenGym, title }) {
  const running = isRunning(session);
  const paused = isPaused(session);
  const done = !running && !paused && session.doneAt != null;
  const pct = running || paused ? Math.round(((session.duration - left) / session.duration) * 100) : done ? 100 : 0;
  const state = running ? "running" : paused ? "paused" : done ? "done" : "idle";

  const mainButton = running ? (
    <button type="button" className="accent-button" onClick={actions.pause}>
      Pause
    </button>
  ) : (
    <button type="button" className="accent-button" onClick={actions.start}>
      {paused ? "Resume" : "Start rest"}
    </button>
  );

  const clock = (
    <span className="rest-clock mono" role="timer" aria-live="off">
      {done ? "Rest over" : formatClock(left)}
    </span>
  );

  if (compact) {
    return (
      <section className={`panel rest-timer rest-timer--compact is-${state}`} aria-label="Gym session rest timer">
        <span className="kicker accent">{title ? `${title} ·` : "Gym session"}</span>
        {clock}
        <div className="rest-actions">
          {mainButton}
          <button type="button" className="ghost-button bordered" onClick={actions.reset}>
            Reset
          </button>
          {onOpenGym && (
            <button type="button" className="ghost-button bordered" onClick={onOpenGym}>
              Open gym
            </button>
          )}
        </div>
        <div className="rest-meter" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
      </section>
    );
  }

  return (
    <section className={`panel rest-timer is-${state}`} aria-labelledby="rest-timer-title">
      <h2 id="rest-timer-title" className="kicker accent">
        Rest timer
      </h2>
      {clock}
      <div className="rest-meter" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="rest-actions">
        {mainButton}
        <button type="button" className="ghost-button bordered" onClick={actions.reset}>
          Reset
        </button>
      </div>
      <div className="rest-length">
        <span className="muted small-text">Rest length</span>
        <div className="rest-length-row">
          <button
            type="button"
            className="square-button small"
            onClick={() => actions.setDuration(session.duration - 15)}
            disabled={session.duration <= MIN_REST}
            aria-label="15 seconds shorter"
          >
            −
          </button>
          <span className="mono rest-length-value">{formatClock(session.duration)}</span>
          <button
            type="button"
            className="square-button small"
            onClick={() => actions.setDuration(session.duration + 15)}
            disabled={session.duration >= MAX_REST}
            aria-label="15 seconds longer"
          >
            +
          </button>
        </div>
        <div className="rest-presets">
          {REST_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rest-preset mono${p === session.duration ? " selected" : ""}`}
              aria-pressed={p === session.duration}
              onClick={() => actions.setDuration(p)}
            >
              {formatClock(p)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
