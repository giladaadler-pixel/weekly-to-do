// Little "dopamine" feedback for every click: the thing you clicked does a springy bounce,
// and a ring + a few colored sparks pop out where you clicked. Ticking a task off gets a
// bigger confetti burst (see confetti()).
// Drawn straight into <body>, never blocks clicks, and does nothing with reduced motion.

const CLICKABLE =
  'button, a[href], [role="button"], [role="tab"], [role="menuitem"], label, summary, select, input[type="checkbox"], input[type="radio"], .task';
const SPARK_COLORS = ["var(--accent)", "var(--violet)", "var(--gold)", "var(--high)", "var(--low)"];
const BURST_MS = 650;
const CONFETTI_MS = 1000;

function reducedMotion(win) {
  return Boolean(win.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function layer(win, x, y, className) {
  const el = win.document.createElement("div");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  win.document.body.append(el);
  return el;
}

function center(element) {
  const r = element.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

// Restarts the bounce even if you click the same thing again mid-animation.
export function bounce(element) {
  element.classList.remove("fx-bounce");
  void element.offsetWidth;
  element.classList.add("fx-bounce");
  element.addEventListener("animationend", () => element.classList.remove("fx-bounce"), { once: true });
}

export function sparkBurst(x, y, win = window) {
  if (reducedMotion(win)) return;
  const burst = layer(win, x, y, "fx-burst");
  const ring = win.document.createElement("span");
  ring.className = "fx-ring";
  burst.append(ring);
  const count = 8;
  const offset = Math.random() * Math.PI;
  for (let i = 0; i < count; i++) {
    const angle = offset + (i / count) * 2 * Math.PI;
    const dist = 18 + Math.random() * 14;
    const spark = win.document.createElement("span");
    spark.className = "fx-spark";
    spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    spark.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
    burst.append(spark);
  }
  win.setTimeout(() => burst.remove(), BURST_MS);
}

// A bigger burst of falling confetti, for finishing a task.
export function confetti(element, win = window) {
  if (reducedMotion(win) || !element) return;
  const [x, y] = center(element);
  const burst = layer(win, x, y, "fx-confetti");
  for (let i = 0; i < 16; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const dist = 40 + Math.random() * 45;
    const piece = win.document.createElement("span");
    piece.className = "fx-confetti-piece";
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    piece.style.setProperty("--spin", `${(Math.random() - 0.5) * 720}deg`);
    piece.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
    burst.append(piece);
  }
  win.setTimeout(() => burst.remove(), CONFETTI_MS);
}

// Wires the click feedback up for the whole app. Returns a function that removes it.
export function installClickFx(win = window) {
  let last = 0;
  function onClick(e) {
    if (reducedMotion(win)) return;
    const target = e.target instanceof win.Element ? e.target.closest(CLICKABLE) : null;
    if (!target || target.disabled) return;
    // Clicking a <label> fires a second click on its input; only celebrate once.
    const now = Date.now();
    if (now - last < 60) return;
    last = now;
    // A checkbox's label bounces its little box, not the whole label.
    const face = target.matches("label") ? target.querySelector(".check-box-face") : null;
    bounce(face || target);
    // Keyboard "clicks" have no pointer position, so burst from the element's middle.
    const [x, y] = e.detail === 0 || (e.clientX === 0 && e.clientY === 0) ? center(target) : [e.clientX, e.clientY];
    sparkBurst(x, y, win);
  }
  win.document.addEventListener("click", onClick, true);
  return () => win.document.removeEventListener("click", onClick, true);
}
