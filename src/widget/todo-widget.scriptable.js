// Weekly To-Do home-screen widget, for the free Scriptable app on iPhone.
// Name this script exactly "To-Do Widget" in Scriptable so the site's
// "Send to widget" button can find it. Tapping the widget opens the site.

const SITE = "https://giladaadler-pixel.github.io/weekly-to-do/";
const BG = new Color("#070a12");
const TEXT = new Color("#e8edf7");
const MUTED = new Color("#7d8799");
const ACCENT = new Color("#3ee6f0");
const DOTS = { high: new Color("#ff6b81"), medium: new Color("#ffb547"), low: new Color("#7cffb2") };

const fm = FileManager.local();
const file = fm.joinPath(fm.documentsDirectory(), "todo-widget.json");

// Opened from the site's button: save the list it sent.
const sent = args.queryParameters && args.queryParameters.data;
if (sent) fm.writeString(file, sent);

let data = null;
if (fm.fileExists(file)) {
  try {
    data = JSON.parse(fm.readString(file));
  } catch (e) {
    data = null;
  }
}

const widget = build(data, config.widgetFamily || "medium");
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Run in the app (or from the site's button): preview it, so you know it worked.
  await widget.presentMedium();
}
Script.complete();

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayTitle(iso) {
  if (iso === todayIso()) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  const df = new DateFormatter();
  df.dateFormat = "EEE, MMM d";
  return df.string(new Date(y, m - 1, d));
}

function build(data, family) {
  const w = new ListWidget();
  w.backgroundColor = BG;
  w.url = SITE;
  w.setPadding(12, 14, 12, 14);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (!data || !Array.isArray(data.t)) {
    const t = w.addText("To-Do");
    t.font = Font.boldSystemFont(15);
    t.textColor = ACCENT;
    w.addSpacer(6);
    const n = w.addText("Tap “Send to widget” on a day in the app.");
    n.font = Font.systemFont(12);
    n.textColor = MUTED;
    return w;
  }

  const tasks = data.t;
  const done = tasks.filter((x) => x.d).length;

  const head = w.addStack();
  head.centerAlignContent();
  const title = head.addText(dayTitle(data.d).toUpperCase());
  title.font = Font.boldSystemFont(12);
  title.textColor = ACCENT;
  head.addSpacer();
  const count = head.addText(`${done}/${tasks.length}`);
  count.font = Font.mediumMonospacedSystemFont(12);
  count.textColor = MUTED;
  w.addSpacer(8);

  if (!tasks.length) {
    const none = w.addText("No tasks 🎉");
    none.font = Font.systemFont(13);
    none.textColor = MUTED;
    w.addSpacer();
    return w;
  }

  const max = family === "large" ? 12 : family === "small" ? 4 : 5;
  const shown = tasks.slice(0, max);
  for (const task of shown) {
    const row = w.addStack();
    row.centerAlignContent();
    const mark = row.addText(task.d ? "✓" : "●");
    mark.font = Font.systemFont(task.d ? 12 : 8);
    mark.textColor = task.d ? MUTED : DOTS[task.p] || DOTS.medium;
    row.addSpacer(7);
    const label = row.addText(task.x);
    label.font = family === "small" ? Font.systemFont(12) : Font.systemFont(13);
    label.textColor = task.d ? MUTED : TEXT;
    label.lineLimit = 1;
    w.addSpacer(4);
  }
  if (tasks.length > shown.length) {
    const more = w.addText(`+${tasks.length - shown.length} more`);
    more.font = Font.systemFont(11);
    more.textColor = MUTED;
  }
  w.addSpacer();
  return w;
}
