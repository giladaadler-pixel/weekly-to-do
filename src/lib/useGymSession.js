import { useEffect, useState } from "react";
import {
  loadSession,
  saveSession,
  startSession,
  endSession,
  startTimer,
  pauseTimer,
  resetTimer,
  finishTimer,
  setDuration,
  countSet,
  secondsLeft,
} from "./restTimer.js";
import { playRestOver, unlockAudio } from "./restAlert.js";

// Only beep if the rest ended in the last minute (not when reopening the app much later).
const LATE_BEEP_MS = 60_000;

// The gym session and rest timer, held at app level so the countdown keeps going
// when you switch pages.
export default function useGymSession() {
  const [session, setSession] = useState(() => loadSession());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => saveSession(session), [session]);

  // Tick while counting down; finish (and beep) at zero.
  useEffect(() => {
    if (session.endsAt == null) return undefined;
    function tick() {
      const t = Date.now();
      setNow(t);
      if (t >= session.endsAt) {
        if (t - session.endsAt < LATE_BEEP_MS) playRestOver();
        setSession((s) => finishTimer(s, t));
      }
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session.endsAt]);

  const actions = {
    startSession: (planId = null) => setSession((s) => startSession(s, Date.now(), planId)),
    endSession: () => setSession((s) => endSession(s)),
    start: () => {
      unlockAudio();
      const t = Date.now();
      setNow(t);
      setSession((s) => startTimer(s, t));
    },
    // After logging a set: count it and start the rest from the full length.
    afterSet: () => {
      unlockAudio();
      const t = Date.now();
      setNow(t);
      setSession((s) => startTimer(resetTimer(countSet(s)), t));
    },
    pause: () => setSession((s) => pauseTimer(s, Date.now())),
    reset: () => setSession((s) => resetTimer(s)),
    setDuration: (secs) => setSession((s) => setDuration(s, secs)),
  };

  return { session, left: secondsLeft(session, now), actions };
}
