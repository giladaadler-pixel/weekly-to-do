// Calendar event notifications ("Notify me 10 minutes before").
// Which alerts already went off lives under its own storage key, so the main saved data
// (weekly-to-do:v1) is never touched. Nothing here throws.

export const FIRED_KEY = "weekly-to-do:event-alerts";
const KEEP_DAYS = 14;

// Set of "eventId@YYYY-MM-DD" keys already shown.
export function loadFired(storage) {
  try {
    storage ??= window.localStorage;
    const saved = JSON.parse(storage.getItem(FIRED_KEY));
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

// Saves the keys, dropping ones for dates more than two weeks old so the list stays small.
export function saveFired(fired, storage, now = new Date()) {
  try {
    storage ??= window.localStorage;
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const kept = [...fired].filter((key) => (key.split("@")[1] ?? "") >= cutoffIso);
    storage.setItem(FIRED_KEY, JSON.stringify(kept));
  } catch {
    // Storage blocked: an alert may show twice, which is fine.
  }
}

// Asks for notification permission if it hasn't been asked yet. Call it from a tap.
// Returns "granted" | "denied" | "default" | "unsupported".
export async function askNotificationPermission() {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    if (Notification.permission !== "default") return Notification.permission;
    return await Notification.requestPermission();
  } catch {
    return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  }
}

// A system notification. Goes through the service worker when there is one (the only way
// that works in an installed iPhone/Android app), else the plain Notification API.
export async function showSystemNotification(title, body, tag) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    const options = { body, tag, icon: "icon-192.png", badge: "icon-192.png", renotify: true };
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
