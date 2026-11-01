// The home-screen widget lives in the Scriptable app (see src/widget/). The site can't
// share its saved data with another app, so "Send to widget" opens Scriptable with the
// day's list in the link, and the widget script saves it.

export const WIDGET_SCRIPT_NAME = "To-Do Widget";

// A small copy of one day's rows (from dayRows), keeping the link short.
export function widgetPayload(rows, date) {
  return {
    d: date,
    t: rows.map((r) => ({ x: r.text, d: Boolean(r.done), p: r.priority ?? "medium" })),
  };
}

export function widgetLink(rows, date) {
  const data = encodeURIComponent(JSON.stringify(widgetPayload(rows, date)));
  return `scriptable:///run/${encodeURIComponent(WIDGET_SCRIPT_NAME)}?data=${data}`;
}
