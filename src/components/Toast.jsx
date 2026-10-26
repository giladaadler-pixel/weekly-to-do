import { useEffect } from "react";

export const TOAST_MS = 2400;

// A short message at the bottom centre that closes itself. Give it a new key to restart
// the timer when the same message shows again.
export default function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
