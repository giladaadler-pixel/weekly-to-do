# Round 1: Home-Screen App, Sidebar, Today Page, Goal Notes — Design

**Date:** 2026-10-19
**Owner:** Gilad Adler
**Repo:** giladaadler-pixel/weekly-to-do
**Live site:** https://giladaadler-pixel.github.io/weekly-to-do/
**Builds on:** `2026-10-15-weekly-to-do-design.md`
**Status:** ✅ Round 1 built (2026-10-19). Still to do: section 12's manual checks on a real iPhone (install, offline, badge, calendar reminder, export → import, safe areas, dark mode).

## 1. Purpose and decisions

Turn the weekly to-do site into a free, installable **home-screen app** that anyone can add from Safari (or any browser), fix the cramped layout, and add a sidebar with room for future pages.

**Decisions made while brainstorming:**

- **No App Store.** Gilad does not want to pay Apple's $99/year. A native widget is therefore out of scope; the free home-screen web app (PWA) is the goal.
- Hosting stays on **GitHub Pages**. Data stays **per device** in `localStorage`. No accounts, no sync.
- Work is split into rounds, each with its own spec → plan → Issues/PRs:
  1. **Round 1 (this spec):** layout, sidebar, Today page, goal notes, streaks, home-screen install, badge, calendar reminder, backup.
  2. **Round 2:** Journal page.
  3. **Round 3:** Gym tracker (exercises, sets, reps, weight, charts).
  4. **Round 4:** Real push notifications via a small free server (e.g. Cloudflare Workers), which also keeps the badge fresh.

**Success looks like:** on Gilad's iPhone, the app is installed from Safari, opens full screen on the Today page, works offline, and shows today's tasks without scrolling past 3–4 items. Each feature below ships through its own Issue → branch → PR → merge, and existing tests keep passing.

## 2. Navigation: sidebar

The `Week | Accomplishments` switch in the top bar is replaced by a sidebar.

**Top bar (slimmer):** `☰ | ◀  dates  ▶  This week` · `✅ X of Y done` · `☀️`. ☰ belongs to the sidebar (the first thing in its strip) and lines up with the top bar's row, just left of the ◀ week arrow; on pages without the arrows it is still in that top-left spot. The ☀️/🌙 theme button stays at the far top right. The week arrows, dates, **This week** button (renamed from "Today" so it isn't confused with the new Today page) and the done count show only on the Week page. Other pages show the page name on the left.

**Sidebar pages (in order):** 📅 Today · 🗓 Week · 🏆 Accomplishments · 📝 Notes. Below a divider: ⏰ Daily reminder · 🔔 Enable badge · ⬇️ Export backup · ⬆️ Import backup. The page list is built from one array so future pages (Journal, Gym) are a one-line addition.

**Laptop behavior (screens wider than 700px):**

| State | Looks like | How you get there |
|---|---|---|
| Tucked | Thin icon strip along the **left** edge, ☰ at the top | Default; ☰ while pinned; moving the mouse away while not pinned |
| Peek | Full sidebar with page names, slid over the content | Mouse hovers over the strip |
| Pinned | Full sidebar, stays open after the mouse leaves | ☰ while tucked or peeking; clicking **anywhere** on the sidebar (strip, page name) |

- Peek slides **over** the content. Pinned **pushes** the content to the right (the page gets narrower) so nothing is hidden behind it. Tucked reserves only the strip's width on the left.
- **☰ toggles:** pinned → tucked, otherwise → pinned. There is **no ✕ button**; ☰ is the only open/close button.
- ☰ has `aria-expanded` (true when pinned) and its label switches between "Open sidebar" and "Close sidebar".
- Pinned state is **saved** (`ui.sidebarPinned`) so it reopens the same way.

**Phone behavior (700px and narrower):** no strip. ☰ stays visible at the top left of the top bar. It slides the sidebar in from the left over a dim backdrop, and ☰ then sits at the top of the sidebar. ☰ again, tapping the backdrop, pressing Escape, or picking a page closes it. `aria-expanded` is true while it's open.

## 3. Pages

### 3.1 Starting page

- Opens on **Today** when launched from the home screen (`display-mode: standalone`) or on a screen 700px or narrower.
- Otherwise opens on **Week**, like now.
- The current page is not saved between visits.

### 3.2 Today page (new)

From top to bottom:

1. **Header:** "Mon, Oct 19" · **🔥 N-day streak** · **"3 of 7 done today"**.
2. **Create new task+** (full width), which opens the existing task modal with today's date.
3. **Today's list:** today's one-off tasks, repeat copies and goal-repeat (🎯) copies, sorted with the existing `sortTasks` (unfinished first, then high → medium → low).
4. **Overdue** (if any), reusing the existing Overdue section.
5. **Goals:** active goal chips (see 4.2).
6. **This week box:** "12 of 31 done" plus six dots for Sun–Fri (filled = day completed per the streak rule, hollow = not, faint = future or no tasks).

### 3.3 Week page (changed)

- Same 2×3 Sun–Fri grid on laptops, still fitting one screen.
- Uses the compact task rows (4.1) and goal chips (4.2), so about 8 tasks fit per day box before it scrolls inside the box.
- **700px and narrower:** one column, full-width day boxes, and the page scrolls (the one-screen rule applies only on laptops).
- Drag a task to another day: unchanged.

### 3.4 Accomplishments page

Unchanged, except it is reached from the sidebar. Each finished goal also shows its note count (📝 N), linking to its notes.

### 3.5 Notes page (new)

Layout ("goal log"):

- **Left column:** active goals (with priority dot), then a collapsed **Finished** group, then **General notes**.
- **Right panel** for the selected goal:
  - Name, due date (if set), a progress bar (checklist steps done, shown only if the description style is Checklist).
  - **"Write a note…"** box. **Save** or **Enter** adds a note dated today to the top of the list. **Shift+Enter** makes a new line. Blank notes are ignored.
  - **Timeline** of notes, newest first, each showing its date and text.
  - Tap a note to edit it in place. Saving blank text keeps the old text. Delete asks "Delete this note?" first.
- **Phone:** the left column fills the screen; tapping a goal opens its panel with a ← back button.
- Opening Notes from a goal's 📝 count selects that goal.
- If there are no goals, it shows General notes and an invitation to create a goal.

## 4. Shared components

### 4.1 Compact task row

`[checkbox] [priority dot] text`

- The priority dropdown and the ✏️/🗑 icons are **removed from the row**.
- Dot colors: high = red, medium = amber, low = green. The dot has an accessible label ("High priority").
- Long text wraps (no cut-off). Repeat (🔁) and goal (🎯) markers stay before the text.
- **Tapping the text opens a Task sheet** (a modal styled like the task modal) with: text field, priority, date (one-off tasks only, which is how you move a task on a phone), **Save**, and **Delete**.
  - For repeat copies, Delete offers the existing choices: "Just this day" / "This and future days".
  - For overdue repeats, the existing "Make up one" / "Clear all" controls stay in the Overdue section.

### 4.2 Goal chip

- Collapsed: one line: priority dot · name · due date (if any) · 📝 N · ✓.
- Tap to expand: shows the description (checklist, bullets, or paragraph) and the existing edit controls, the same as today's goal card. Tap the header again to collapse.
- Marking done keeps the existing 🎉 burst.
- Chips wrap onto new lines. The goals band keeps its max height and scrolls if needed.

## 5. Streaks

Pure function in `src/lib/streaks.js`:

- A day is **completed** if it had at least one task (one-off, repeat or goal-repeat copy) and **all** were done.
- Days with **no tasks** and **Saturdays** are **skipped**: they neither count nor break the streak.
- A day with tasks where any is unfinished **breaks** the streak. Overdue status does not matter; only that day's own tasks count.
- **Today** counts if completed; if not yet completed it is skipped (never breaks).
- The streak walks back from today and stops at the first breaking day, or after 365 days.

## 6. Home-screen install (PWA)

- Add `vite-plugin-pwa`, configured for `base: "/weekly-to-do/"`.
- **Manifest:** name "Weekly To-Do", short name "To-Do", `display: standalone`, theme and background colors matching the app, `start_url` and `scope` = `/weekly-to-do/`.
- **Icons:** a simple checkmark icon (192px, 512px, maskable, plus a 180px `apple-touch-icon`) in `public/`. Gilad can replace it later.
- Add `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, and `theme-color` meta tags in `index.html`.
- **Offline:** the service worker caches the built app so it opens with no internet.
- **Updates:** `registerType: "autoUpdate"`, so a new version is used the next time the app opens after a deploy.
- Respect iPhone safe areas (notch and home bar) with `env(safe-area-inset-*)` padding.

## 7. App badge

- Shows the number of **unfinished tasks today** (the same items as the Today list) using `navigator.setAppBadge(n)`, or `clearAppBadge()` when it's 0.
- Updated whenever state changes and when the app opens or comes back into view.
- If the browser doesn't support it, nothing happens (no errors).
- **iPhone:** badges require notification permission. The sidebar's **🔔 Enable badge** button calls `Notification.requestPermission()`. The button is hidden when it's already granted or unsupported.
- **Known limit (accepted):** without a server, the badge updates only while the app is open. Round 4 fixes this.

## 8. Daily reminder (calendar file)

- Sidebar **⏰ Daily reminder** opens a small modal: a time picker (default 8:00) and **Add to calendar**.
- Generates an `.ics` file in the browser with one event: title "Check your to-do list ✅", 10 minutes long, repeating daily (`RRULE:FREQ=DAILY`), an alert at the event time, and the app's URL in the description and URL fields. Time uses the device's local time zone (floating time).
- The file is offered as a download (`text/calendar`), which on iPhone shows the "Add to Calendar" screen.
- **Must be tested on a real iPhone** in both Safari and the installed app. If the installed app can't open the file, the button opens the same file in Safari instead.
- The chosen time is saved (`settings.reminderTime`) so the modal remembers it.

## 9. Backup

- **Export backup:** downloads `weekly-to-do-backup-YYYY-MM-DD.json` containing the whole saved state.
- **Import backup:** pick a file. If it is valid (a JSON object with a `tasks` array), confirm with "Replace everything on this device with this backup?", then load it. Missing fields fall back to defaults, the same way `loadState` handles them. Invalid files show "That file isn't a Weekly To-Do backup." and change nothing.
- Why: on iPhone the installed app's storage is separate from Safari's, so this is how existing data moves into the app. It also protects against storage being cleared.

## 10. Data changes

Saved state (`weekly-to-do:v1`, same key) gains:

```js
{
  tasks, repeats, goals, theme,          // unchanged
  notes: [ { id, goalId /* or null for general */, text, date /* "YYYY-MM-DD" */ } ],
  ui: { sidebarPinned: false },
  settings: { reminderTime: "08:00" }
}
```

- `DEFAULT_STATE` gets these three keys, so old saves load with empty notes and default settings. No migration is needed.
- Deleting a goal also deletes its notes. The confirmation says "This also deletes its N notes." when N > 0.

## 11. New and changed files (expected)

| File | Change |
|---|---|
| `src/lib/notes.js` (+ test) | make/edit/delete notes, notes for a goal, delete by goal |
| `src/lib/streaks.js` (+ test) | streak count and week dots |
| `src/lib/today.js` (+ test) | today's items and the unfinished count (shared by the Today page and badge) |
| `src/lib/ics.js` (+ test) | build the daily reminder `.ics` text |
| `src/lib/backup.js` (+ test) | export text, validate and parse an import |
| `src/lib/badge.js` | set or clear the badge safely |
| `src/lib/storage.js` | new default keys |
| `src/lib/goals.js` | delete a goal's notes with the goal |
| `src/components/Sidebar.jsx` (+ test) | tucked, peek and pinned states; page list |
| `src/components/TodayPage.jsx` (+ test) | Today page |
| `src/components/NotesPage.jsx` (+ test) | goal log layout |
| `src/components/TaskSheet.jsx` (+ test) | tap-to-edit modal |
| `src/components/GoalChip.jsx` | replaces the goal card in the goals band |
| `src/components/ReminderModal.jsx` | time picker and calendar download |
| `src/components/TaskItem.jsx`, `DayColumn.jsx`, `GoalsBand.jsx`, `TopBar.jsx`, `App.jsx`, `App.css` | compact rows, sidebar wiring, phone layout |
| `vite.config.js`, `index.html`, `public/` icons, `package.json` | PWA setup |
| `README.md` | features list and "How to install on your phone" |

## 12. Testing

- **Unit tests (Vitest):** notes, streaks (skipped days, Saturday, today-not-finished, breaking day, repeats), today items and count, `.ics` output (RRULE, time, URL), backup validate and parse (good file, wrong shape, broken JSON).
- **Component tests:** Sidebar state changes (hover → peek, click → pinned, ✕ → tucked), TaskSheet edit/delete including the repeat choices, Notes page add/edit/delete, Today page shows the right items.
- **Manual checks on a real iPhone:** install from Safari; opens on Today full screen; works in airplane mode; badge after enabling; calendar button adds a repeating event; export from Safari → import in the installed app; safe areas look right; dark mode.
- **Laptop check:** the Week page still fits one screen with about 8 tasks per day box.

## 13. Out of scope (later rounds)

Journal (Round 2), gym tracker (Round 3), push notifications and an always-fresh badge (Round 4), App Store or native widget, accounts or sync between devices.
