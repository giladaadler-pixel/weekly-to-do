// How tightly a Week day box packs its tasks so they fit without scrolling inside it.
// "clipped" is the last resort: tight, but only the rows that fit plus "+N more".
export const DENSITIES = ["normal", "compact", "tight", "clipped"];

// Room a roomier level needs beyond its content before the box moves back up to it,
// so a box sitting right at the edge doesn't flip back and forth.
export const SPARE_PX = 8;

// The level to try next. contentHeight: the box's content at this level; available: the
// room in the box; roomierHeight: the content's height when last measured at the next
// roomier level (null if unknown). Returns level itself when it should stay.
export function nextDensity({ level, contentHeight, available, roomierHeight = null }) {
  const i = DENSITIES.indexOf(level);
  if (contentHeight > available && i < DENSITIES.length - 1) return DENSITIES[i + 1];
  if (i > 0 && roomierHeight !== null && roomierHeight + SPARE_PX <= available) return DENSITIES[i - 1];
  return level;
}
