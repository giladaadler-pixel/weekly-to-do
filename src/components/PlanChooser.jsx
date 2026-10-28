import { useEffect } from "react";
import { createPortal } from "react-dom";

// "Start gym session": pick one of your plans, or No plan. onPick(planId or null).
export default function PlanChooser({ plans, onPick, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal plan-chooser" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Start gym session">
        <h2>Start gym session</h2>
        <p className="muted small-text">Which workout?</p>
        <div className="plan-chooser-list">
          {plans.map((p, i) => (
            <button key={p.id} type="button" className="ghost-button bordered" autoFocus={i === 0} onClick={() => onPick(p.id)}>
              {p.name}
            </button>
          ))}
          <button type="button" className="ghost-button bordered" onClick={() => onPick(null)}>
            No plan
          </button>
        </div>
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
