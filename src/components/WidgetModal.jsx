import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import script from "../widget/todo-widget.scriptable.js?raw";
import { WIDGET_SCRIPT_NAME } from "../lib/widget.js";

// One-time setup for the home-screen widget: copy the Scriptable script and follow the steps.
export default function WidgetModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Home-screen widget">
        <h2>Home-screen widget</h2>
        <p className="modal-note">Shows a day's tasks on your home screen. Tap it to open the app.</p>
        <ol className="widget-steps">
          <li>
            Install <b>Scriptable</b> (free) from the App Store.
          </li>
          <li>Copy the script below. In Scriptable, tap +, paste it, and name it “{WIDGET_SCRIPT_NAME}”.</li>
          <li>On your home screen, add a Scriptable widget. Long-press it → Edit Widget → Script: {WIDGET_SCRIPT_NAME}.</li>
          <li>
            On any day here, tap <b>Send to widget</b>. Tap it again after you change that day's tasks.
          </li>
        </ol>
        <div className="modal-buttons">
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary blue" onClick={copy}>
            {copied ? "Copied ✓" : "Copy script"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
