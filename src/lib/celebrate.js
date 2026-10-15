// A short 🎉 burst at an element. Drawn straight into <body>, not React, because the
// goal card it starts from disappears the moment the goal is marked done.
// Never blocks clicks, and does nothing when the system asks for reduced motion.

const DURATION_MS = 1200;
const SPARKS = 7;

export function celebrate(element, win = window) {
  if (win.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const rect = element.getBoundingClientRect();
  const burst = win.document.createElement("div");
  burst.className = "celebration";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;

  const big = win.document.createElement("span");
  big.className = "celebration-main";
  big.textContent = "🎉";
  burst.append(big);

  for (let i = 0; i < SPARKS; i++) {
    const angle = (i / SPARKS) * 2 * Math.PI - Math.PI / 2;
    const spark = win.document.createElement("span");
    spark.className = "celebration-spark";
    spark.textContent = "🎉";
    spark.style.setProperty("--dx", `${Math.cos(angle) * 56}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * 56}px`);
    burst.append(spark);
  }

  win.document.body.append(burst);
  win.setTimeout(() => burst.remove(), DURATION_MS);
}
