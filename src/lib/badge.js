// The number on the home-screen app's icon. Does nothing where badges aren't supported,
// and never throws: a missing permission or a browser quirk just leaves the badge alone.
export function updateBadge(count, nav = globalThis.navigator) {
  try {
    if (!nav?.setAppBadge) return;
    const result = count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge();
    result?.catch?.(() => {});
  } catch {
    // Unsupported or not allowed: ignore.
  }
}
