// "Rest over" alert: 4 short beeps, plus a buzz on phones that support it.
// iPhone only lets a page play sound after a tap, so unlockAudio() runs on the Start tap.
// iPhone Safari has no vibration, and stays silent when the phone is on silent mode.

export const BEEPS = 4;
const BEEP_SECONDS = 0.18;
const GAP_SECONDS = 0.32;

let ctx = null;

function audioContext() {
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockAudio() {
  try {
    const c = audioContext();
    if (c?.state === "suspended") c.resume();
  } catch {
    // No sound available; the screen flash still shows.
  }
}

// [buzz, pause, buzz, ...] in ms.
export function vibrationPattern(count = BEEPS) {
  const pattern = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) pattern.push(GAP_SECONDS * 1000);
    pattern.push(BEEP_SECONDS * 1000 * 1.5);
  }
  return pattern;
}

export function playRestOver(count = BEEPS) {
  try {
    globalThis.navigator?.vibrate?.(vibrationPattern(count));
  } catch {
    // Ignore: not every browser can buzz.
  }
  try {
    const c = audioContext();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    const start = c.currentTime + 0.05;
    for (let i = 0; i < count; i++) {
      const t = start + i * (BEEP_SECONDS + GAP_SECONDS);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = i === count - 1 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + BEEP_SECONDS);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + BEEP_SECONDS + 0.02);
    }
  } catch {
    // No sound available; the screen flash still shows.
  }
}
