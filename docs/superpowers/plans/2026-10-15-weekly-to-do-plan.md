# Weekly To-Do Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project rule:** Gilad runs every git and GitHub step himself (he is learning GitHub). Coding agents write code and run `npm` commands only. **Never run `git` commands.** When a task's code is done and tests pass, stop and tell Gilad it's ready to commit.

**Goal:** A React weekly planner (Sun–Sat days, tasks, repeats, overdue, monthly goals, goals page, stats, dark mode) deployed to GitHub Pages by GitHub Actions.

**Architecture:** Vite + React single-page app. All logic that can be wrong lives in small pure functions in `src/lib/` (dates as `"YYYY-MM-DD"` strings, "today" always passed in) and is unit-tested with Vitest; components in `src/components/` only render and call those functions. One state object lives in `App.jsx` and is saved to `localStorage` on every change.

**Tech Stack:** React 18, Vite 5, Vitest 2 + jsdom, plain JavaScript (no TypeScript), plain CSS, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-15-weekly-to-do-design.md`

## Global Constraints

- Weeks run **Sunday → Saturday**.
- Data is saved only in the browser's `localStorage`; no backend, no accounts.
- Vite `base` must be `"/weekly-to-do/"`.
- Priorities are exactly `"high" | "medium" | "low"`; default `"medium"`.
- Goal description styles are exactly `"checklist" | "bullets" | "paragraph"`.
- "Done by" choices are exactly: No deadline / End of this week / End of this month / Pick a date….
- Every date in data is a local `"YYYY-MM-DD"` string; every month is `"YYYY-MM"`.
- Done style everywhere: ✓, line-through, faded, moved to the bottom; clicking again undoes.
- Plain JavaScript only; no TypeScript, no UI or state libraries beyond React.

## Review Focus

1. **Time zone at midnight:** dates must come from local time, never `toISOString()` (which is UTC and gives yesterday's date before 03:00 in Israel). Pinned in Task 1.
2. **Daylight-saving weeks:** adding days must not drift when clocks change (Israel, late March and late October). Pinned in Task 1.
3. **Blocked storage** (private window, storage full): the app must still work, just without saving. Pinned in Task 2.
4. **Editing a task to empty text:** keeps the old text instead of saving a blank task. Pinned in Task 2.
5. **Deleting a goal that has goal days:** its 🎯 repeats disappear too, including from Overdue. Pinned in Task 10.

---

## File structure

```
index.html                     Vite entry (replaces current placeholder page)
package.json / package-lock.json
vite.config.js                 base path + Vitest config
.gitignore                     node_modules, dist
.github/workflows/deploy.yml   build + publish to Pages on push to main
.github/workflows/test.yml     run tests on every pull request
src/main.jsx                   mounts <App/>
src/App.jsx                    holds state, page switch, saves to storage
src/App.css                    all styles (CSS variables for themes)
src/lib/dates.js               date math
src/lib/storage.js             load/save state
src/lib/tasks.js               task helpers
src/lib/repeats.js             repeating tasks + missed counter
src/lib/goals.js               goal helpers
src/lib/stats.js               "X of Y done"
src/lib/*.test.js              Vitest tests, one file per lib file
src/components/TopBar.jsx      page switch, week arrows, stats, theme button
src/components/WeekView.jsx    goals band + 7 day columns
src/components/DayColumn.jsx   one day: tasks, repeats, add form, overdue
src/components/TaskItem.jsx    one task row
src/components/AddTask.jsx     add-task form (text, priority, repeat days)
src/components/OverdueSection.jsx
src/components/GoalsBand.jsx   goal cards + green create button
src/components/GoalCard.jsx
src/components/GoalModal.jsx   create-goal pop-up
src/components/GoalsPage.jsx   "(Month) Goals:" checklist page
```

## How every task ships (Gilad's GitHub workflow)

For each task below:

1. **Issue:** on GitHub, create an Issue titled with the task name (e.g. "Setup: React + Vite + deploy").
2. **Branch:** `git switch main && git pull`, then `git switch -c <branch-name>` (branch name given in each task).
3. **Code:** Claude Code implements the task's steps (no git).
4. **Commit + push:** `git add .`, `git commit -m "<message given in task>"`, `git push -u origin <branch-name>`.
5. **Pull request:** open a PR on GitHub, write `Closes #<issue number>` in the description, wait for the **test** check ✅, read the diff.
6. **Merge**, then `git switch main && git pull`. The deploy workflow updates the live site.

---

### Task 0: Setup — React + Vite + deploy

Branch `setup-react-vite` · Commit `Set up React + Vite with deploy and test workflows`

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, `.github/workflows/deploy.yml`, `.github/workflows/test.yml`
- Modify: `index.html` (replace entirely)

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` (= `vitest run --passWithNoTests`); `<App/>` default export.

- [ ] **Step 1: Check Node.** Run `node --version`. Expected: `v20` or higher. If missing, install the LTS version from nodejs.org, then re-check.
- [ ] **Step 2: Create the project files.** `package.json` with dependencies `react`, `react-dom` (18.x) and devDependencies `vite` (5.x), `@vitejs/plugin-react`, `vitest` (2.x), `jsdom`; scripts `dev: vite`, `build: vite build`, `preview: vite preview`, `test: vitest run --passWithNoTests`. `vite.config.js`: react plugin, `base: "/weekly-to-do/"`, `test: { environment: "jsdom" }`. `.gitignore`: `node_modules`, `dist`. `index.html`: title "Weekly To-Do", `<div id="root">`, `<script type="module" src="/src/main.jsx">`. `App.jsx` renders `<h1>My Week</h1>`.
- [ ] **Step 3: Install.** Run `npm install`. Expected: creates `node_modules/` and `package-lock.json`, no errors.
- [ ] **Step 4: Run locally.** Run `npm run dev`, open the printed URL. Expected: "My Week" shows.
- [ ] **Step 5: Build + test.** Run `npm run build` then `npm test`. Expected: build creates `dist/`; tests report "No test files found, exiting with code 0".
- [ ] **Step 6: Workflows.** `deploy.yml`: on push to `main` and `workflow_dispatch`; permissions `contents: read, pages: write, id-token: write`; job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (node 20, cache npm), `npm ci`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` with `path: dist`; job `deploy` (needs build, environment `github-pages`): `actions/deploy-pages@v4`. `test.yml`: on `pull_request`; checkout, setup-node 20, `npm ci`, `npm test`.
- [ ] **Step 7: Gilad — switch Pages source.** After merging: repo **Settings → Pages → Source → GitHub Actions**. Then **Actions** tab → "deploy" → **Run workflow**. Expected: live site shows "My Week" served by React.

---

### Task 1: Week grid + highlight today

Branch `week-grid` · Commit `Add Sun–Sat week grid with today highlighted`

**Files:**
- Create: `src/lib/dates.js`, `src/lib/dates.test.js`, `src/components/WeekView.jsx`, `src/components/DayColumn.jsx`
- Modify: `src/App.jsx`, `src/App.css`

**Interfaces:**
- Produces (all dates are `"YYYY-MM-DD"` strings):
  - `toISO(date: Date) -> string` (local time)
  - `todayISO() -> string`
  - `addDays(iso, n) -> string`
  - `weekStart(iso) -> string` (the Sunday)
  - `weekDays(startIso) -> string[7]`
  - `dayLabel(iso) -> "Sun"…"Sat"`
  - `WeekView({ weekStartIso, todayIso, ... })`, `DayColumn({ date, isToday, children })`

- [ ] **Step 1: Write failing tests** in `dates.test.js`:
```js
expect(toISO(new Date(2026, 9, 15, 0, 30))).toBe("2026-10-15");   // just after midnight
expect(weekStart("2026-10-15")).toBe("2026-10-11");
expect(weekStart("2026-10-11")).toBe("2026-10-11");
expect(weekStart("2026-10-17")).toBe("2026-10-11");
expect(weekDays("2026-10-11")).toEqual(["2026-10-11","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-17"]);
expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
expect(addDays("2026-03-26", 2)).toBe("2026-03-28");                // across DST change
expect(addDays("2026-10-24", 7)).toBe("2026-10-31");                // across DST change
expect(dayLabel("2026-10-15")).toBe("Thu");
```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, functions not defined.
- [ ] **Step 3: Implement `dates.js`.** Parse with `new Date(y, m - 1, d)` and do day math with `setDate(getDate() + n)` (never milliseconds), format with `getFullYear/getMonth/getDate` padded.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: UI.** `App` computes `todayIso = todayISO()` and renders `WeekView` for `weekStart(todayIso)`: 7 `DayColumn`s headed `dayLabel` + day number; the column whose date equals `todayIso` gets class `today` (distinct background).
- [ ] **Step 6: Check** with `npm run dev`: Sun–Sat columns, today highlighted. Then hand off to Gilad to commit.

---

### Task 2: Add / check / edit / delete tasks + saving

Branch `tasks-crud` · Commit `Add, check, edit and delete tasks with saving`

**Files:**
- Create: `src/lib/storage.js`, `src/lib/storage.test.js`, `src/lib/tasks.js`, `src/lib/tasks.test.js`, `src/components/TaskItem.jsx`, `src/components/AddTask.jsx`
- Modify: `src/App.jsx`, `src/components/DayColumn.jsx`, `src/App.css`

**Interfaces:**
- Produces:
  - `STORAGE_KEY = "weekly-to-do:v1"`
  - `DEFAULT_STATE = { tasks: [], repeats: [], goals: [], theme: "light" }`
  - `loadState(storage = window.localStorage) -> state` (missing keys filled from `DEFAULT_STATE`)
  - `saveState(state, storage = window.localStorage) -> void` (never throws)
  - `makeTask(text, date, priority = "medium") -> task | null` (task = `{ id, text, date, done: false, priority }`, `id` from `crypto.randomUUID()`)
  - `updateTask(tasks, id, changes) -> tasks`, `deleteTask(tasks, id) -> tasks`
  - `editText(tasks, id, newText) -> tasks` (blank `newText` → unchanged)

- [ ] **Step 1: Write failing tests.**
```js
// storage.test.js — use a fake storage object { getItem, setItem }
expect(loadState(fake({}))).toEqual(DEFAULT_STATE);                       // nothing saved
expect(loadState(fake({ [STORAGE_KEY]: "not json" }))).toEqual(DEFAULT_STATE);
expect(loadState({ getItem() { throw new Error("blocked"); } })).toEqual(DEFAULT_STATE);
expect(() => saveState(DEFAULT_STATE, { setItem() { throw new Error("full"); } })).not.toThrow();
// round trip: saveState(s, f); loadState(f) deep-equals s

// tasks.test.js
expect(makeTask("   ", "2026-10-15")).toBeNull();
expect(makeTask(" Gym ", "2026-10-15")).toMatchObject({ text: "Gym", date: "2026-10-15", done: false, priority: "medium" });
expect(editText([t], t.id, "  ")[0].text).toBe(t.text);
expect(deleteTask([t], t.id)).toEqual([]);
```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `storage.js` (try/catch around `getItem`/`JSON.parse`/`setItem`) and `tasks.js`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: UI.** `App` state = `loadState()`; `useEffect` calls `saveState` on every change. Each `DayColumn` lists its date's tasks as `TaskItem` (checkbox toggles `done`, ✏️ edits inline with Enter to save / Esc to cancel, 🗑 deletes) and ends with `AddTask` (text box + Add; Enter submits).
- [ ] **Step 6: Check** in browser: add, check, edit, delete; reload page → tasks still there.

---

### Task 3: "Done" style

Branch `done-style` · Commit `Style completed tasks: check, cross out, fade, move to bottom`

**Files:** Modify `src/lib/tasks.js`, `src/lib/tasks.test.js`, `src/components/TaskItem.jsx`, `src/components/DayColumn.jsx`, `src/App.css`

**Interfaces:**
- Produces: `sortTasks(tasks) -> tasks` (new array; unfinished before done; otherwise original order). CSS class `.done` used by tasks, checklist items and goal cards in later tasks.

- [ ] **Step 1: Failing test:** `sortTasks([a(done), b, c(done), d]).map(t => t.id)` equals `[b, d, a, c]`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `sortTasks` (stable sort on `done`). `.done`: ✓ shown, `text-decoration: line-through`, `opacity: 0.45`. `DayColumn` renders `sortTasks(...)`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser: checking a task moves it to the bottom faded; unchecking restores it.

---

### Task 4: Priorities

Branch `priorities` · Commit `Add high/medium/low priority to tasks`

**Files:** Modify `src/lib/tasks.js`, `src/lib/tasks.test.js`, `src/components/AddTask.jsx`, `src/components/TaskItem.jsx`, `src/App.css`

**Interfaces:**
- Produces: `PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }`; `sortTasks` now orders unfinished by priority, then done last.

- [ ] **Step 1: Failing test:** unfinished `[low, high, medium]` plus done `high` → order `[high, medium, low, doneHigh]`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** `AddTask` gets a priority `<select>` (default Medium); `TaskItem` shows a colored tag and lets you change it (`updateTask`). Colors: high red, medium amber, low green (CSS variables).
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser.

---

### Task 5: Week navigation

Branch `week-navigation` · Commit `Add previous/next week navigation`

**Files:**
- Create: `src/components/TopBar.jsx`
- Modify: `src/lib/dates.js`, `src/lib/dates.test.js`, `src/App.jsx`, `src/components/WeekView.jsx`

**Interfaces:**
- Produces: `formatWeekRange(startIso) -> string`; `App` state `viewWeek` (a Sunday ISO, starts at `weekStart(today)`); `TopBar({ viewWeek, onPrev, onNext, ... })`.

- [ ] **Step 1: Failing tests:**
```js
expect(formatWeekRange("2026-10-11")).toBe("Oct 11 – 17, 2026");
expect(formatWeekRange("2026-11-29")).toBe("Nov 29 – Dec 5, 2026");
expect(formatWeekRange("2026-12-27")).toBe("Dec 27, 2026 – Jan 2, 2027");
```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** ◀ / ▶ change `viewWeek` by `addDays(±7)`. `viewWeek` is not saved (always opens on this week). Today highlight only appears when today is in the viewed week.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser.

---

### Task 6: Overdue section

Branch `overdue` · Commit `Show unfinished past tasks under Overdue in today's column`

**Files:**
- Create: `src/components/OverdueSection.jsx`
- Modify: `src/lib/tasks.js`, `src/lib/tasks.test.js`, `src/components/DayColumn.jsx`

**Interfaces:**
- Produces: `overdueTasks(tasks, todayIso) -> tasks` (not done, `date < todayIso`, oldest first); `overdueLabel(date, todayIso) -> string` (`dayLabel` if within the last 6 days, else `"Oct 5"` style).

- [ ] **Step 1: Failing tests** (today `"2026-10-15"`): tasks dated `10-14` (open), `10-13` (done), `10-15` (open), `10-20` (open), `10-01` (open) → result dates `["2026-10-01", "2026-10-14"]`. `overdueLabel("2026-10-13", "2026-10-15")` → `"Tue"`; `overdueLabel("2026-10-05", "2026-10-15")` → `"Oct 5"`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** Only the column where `date === todayIso` renders `OverdueSection` under its tasks, heading "Overdue", hidden when empty. Each row is a `TaskItem` plus `(label)`; checking it marks the original task done. Tasks still show in their own day too.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser by adding a task to yesterday.

---

### Task 7: Drag tasks between days

Branch `drag-tasks` · Commit `Drag tasks between days`

**Files:** Modify `src/lib/tasks.js`, `src/lib/tasks.test.js`, `src/components/TaskItem.jsx`, `src/components/DayColumn.jsx`, `src/App.css`

**Interfaces:**
- Produces: `moveTask(tasks, id, newDate) -> tasks`.

- [ ] **Step 1: Failing test:** `moveTask([t], t.id, "2026-10-17")[0].date` is `"2026-10-17"`, other fields unchanged.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** with native HTML drag and drop: `TaskItem` `draggable` and `onDragStart` sets `dataTransfer` to the task id; `DayColumn` `onDragOver` (preventDefault, add `.drop-target`) and `onDrop` calls `moveTask`. Only normal tasks in day lists are draggable (not Overdue rows, not repeats).
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser.

---

### Task 8: Repeating tasks + missed counter

Branch `repeating-tasks` · Commit `Add repeating tasks with missed counter in Overdue`

**Files:**
- Create: `src/lib/repeats.js`, `src/lib/repeats.test.js`
- Modify: `src/components/AddTask.jsx`, `src/components/DayColumn.jsx`, `src/components/TaskItem.jsx`, `src/components/OverdueSection.jsx`, `src/App.jsx`

**Interfaces:**
- Produces (`days` = numbers 0 Sun … 6 Sat):
  - `makeRepeat({ text, days, priority = "medium", startDate, endDate = null, goalId = null }) -> repeat | null` (null if text blank or `days` empty; repeat also has `doneDates: [], skipDates: [], clearedThrough: null`)
  - `occursOn(repeat, iso) -> boolean`
  - `toggleDoneOn(repeat, iso) -> repeat`
  - `missedDates(repeat, todayIso) -> string[]` (oldest first)
  - `makeUpOne(repeat, todayIso) -> repeat` (adds oldest missed date to `doneDates`)
  - `clearAll(repeat, todayIso) -> repeat` (`clearedThrough = addDays(todayIso, -1)`)
  - `deleteOne(repeat, iso) -> repeat` (adds to `skipDates`)
  - `deleteFuture(repeat, iso) -> repeat` (`endDate = addDays(iso, -1)`)

- [ ] **Step 1: Failing tests** with `r = makeRepeat({ text: "Gym", days: [2, 4], startDate: "2026-10-11" })` (Tue, Thu):
```js
expect(makeRepeat({ text: "Gym", days: [], startDate: "2026-10-11" })).toBeNull();
expect(occursOn(r, "2026-10-13")).toBe(true);   // Tue
expect(occursOn(r, "2026-10-14")).toBe(false);  // Wed
expect(occursOn(r, "2026-10-06")).toBe(false);  // before start
expect(occursOn(deleteOne(r, "2026-10-13"), "2026-10-13")).toBe(false);
expect(occursOn(deleteFuture(r, "2026-10-20"), "2026-10-20")).toBe(false);
expect(occursOn(deleteFuture(r, "2026-10-20"), "2026-10-15")).toBe(true);
const r2 = toggleDoneOn(r, "2026-10-13");
expect(missedDates(r2, "2026-10-22")).toEqual(["2026-10-15", "2026-10-20"]);   // today itself not missed
expect(missedDates(makeUpOne(r2, "2026-10-22"), "2026-10-22")).toEqual(["2026-10-20"]);
expect(missedDates(clearAll(r2, "2026-10-22"), "2026-10-22")).toEqual([]);
```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `repeats.js` (walk day by day with `addDays`).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: UI.** `AddTask` gets optional day checkboxes Sun–Sat; if any are checked it creates `makeRepeat({ ..., startDate: <that column's date> })` into `state.repeats` instead of a task. `DayColumn` shows repeats where `occursOn` (with a 🔁 mark), checkbox = `toggleDoneOn`, sorted with tasks via the same rules. 🗑 on a repeat shows two buttons: "Just this day" (`deleteOne`) / "This and all future days" (`deleteFuture`). `OverdueSection` adds one row per repeat with missed days: `text  N×`, checkbox = `makeUpOne`, small "clear all" = `clearAll`.
- [ ] **Step 6: Check** in browser.

---

### Task 9: Goals band + "Create new goal" modal

Branch `goals-band` · Commit `Add goals band and create-goal modal`

**Files:**
- Create: `src/lib/goals.js`, `src/lib/goals.test.js`, `src/components/GoalsBand.jsx`, `src/components/GoalCard.jsx`, `src/components/GoalModal.jsx`
- Modify: `src/lib/dates.js`, `src/lib/dates.test.js`, `src/components/WeekView.jsx`, `src/App.jsx`, `src/App.css`

**Interfaces:**
- Produces:
  - dates: `monthKey(iso) -> "YYYY-MM"`, `endOfWeek(iso) -> iso` (Saturday), `endOfMonth(iso) -> iso`, `formatShort(iso) -> "Oct 31"`
  - `resolveDueDate(choice: "none"|"week"|"month"|"date", todayIso, pickedIso) -> iso | null`
  - `makeGoal({ title, style, items, text, priority = "medium", dueDate = null }, todayIso) -> goal | null` (goal = `{ id, title, month, done: false, priority, dueDate, style, items, text }`, `month = monthKey(todayIso)`; null if title blank)
  - `goalsForMonth(goals, month) -> goals` (unfinished by priority, then done)
  - `convertStyle(goal, newStyle) -> goal`
  - `updateGoal(goals, id, changes)`, `deleteGoal(goals, id)`

- [ ] **Step 1: Failing tests:**
```js
expect(endOfWeek("2026-10-15")).toBe("2026-10-17");
expect(endOfWeek("2026-10-17")).toBe("2026-10-17");
expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
expect(resolveDueDate("none", "2026-10-15")).toBeNull();
expect(resolveDueDate("month", "2026-10-15")).toBe("2026-10-31");
expect(resolveDueDate("date", "2026-10-15", "2026-11-03")).toBe("2026-11-03");
expect(makeGoal({ title: "  " }, "2026-10-15")).toBeNull();
expect(makeGoal({ title: "Run 50 km", style: "paragraph", text: "x" }, "2026-10-15").month).toBe("2026-10");
// convertStyle
expect(convertStyle(checklistGoal /* items a(done), b */, "bullets").items).toEqual(checklistGoal.items);
expect(convertStyle(checklistGoal, "paragraph").text).toBe("a\nb");
expect(convertStyle(paragraphGoal /* text "a\n\nb" */, "checklist").items).toEqual([{ text: "a", done: false }, { text: "b", done: false }]);
// goalsForMonth: Oct goals [low, done-high, high] + one Nov goal → [high, low, done-high]
```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `goals.js` and the new date helpers.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: UI.** `GoalsBand` (full width above the days) shows `goalsForMonth(goals, monthKey(today))` as `GoalCard`s and a green **"+ Create new goal"** button. `GoalModal`: Title; Description with style picker (Checklist / Bullets / Paragraph) and an editor for that style (add/remove lines, or a textarea); Priority select; "Done by" select (No deadline / End of this week / End of this month / Pick a date… → shows a date input); Cancel / Create goal (disabled while title is blank; Esc = Cancel). `GoalCard`: title, ✓ button (toggles `done`, `.done` style, card moves last), priority tag, "Due Oct 31" when `dueDate`, the description in its style (checklist items toggle and use `.done` style + move to bottom), a style picker using `convertStyle`, and 🗑.
- [ ] **Step 6: Check** in browser.

---

### Task 10: Goal days

Branch `goal-days` · Commit `Show goals as tasks on chosen days`

**Files:** Modify `src/components/GoalModal.jsx`, `src/lib/repeats.js`, `src/lib/repeats.test.js`, `src/lib/goals.js`, `src/lib/goals.test.js`, `src/App.jsx`, `src/components/DayColumn.jsx`, `src/components/OverdueSection.jsx`

**Interfaces:**
- Consumes: `makeRepeat` (Task 8), `makeGoal`, `deleteGoal` (Task 9)
- Produces: `activeRepeats(repeats, goals) -> repeats` (drops repeats whose `goalId` goal is done or missing); `deleteGoalAndRepeats(state, goalId) -> state`.

- [ ] **Step 1: Failing tests:** a repeat with `goalId` of a done goal is dropped by `activeRepeats`; a repeat with no `goalId` is kept; `deleteGoalAndRepeats` removes the goal and every repeat with that `goalId`; goal created with `dueDate "2026-10-31"` and days `[2]` → its repeat has `endDate "2026-10-31"` and `goalId` set.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** `GoalModal` adds optional "Show on days" checkboxes Sun–Sat. On Create, if any are checked, also add `makeRepeat({ text: title, days, priority, startDate: today, endDate: dueDate, goalId })`. Everywhere repeats are shown (day columns, Overdue, later stats) use `activeRepeats`. Goal-day rows show 🎯. Deleting a goal uses `deleteGoalAndRepeats`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser: completing the goal makes its 🎯 rows vanish.

---

### Task 11: Goals page + Week/Goals switch

Branch `goals-page` · Commit `Add Goals page and page switch`

**Files:**
- Create: `src/components/GoalsPage.jsx`
- Modify: `src/lib/dates.js`, `src/lib/dates.test.js`, `src/components/TopBar.jsx`, `src/App.jsx`

**Interfaces:**
- Produces: `addMonths(month, n) -> "YYYY-MM"`, `monthHeader(month) -> "October Goals:"`; `App` state `page: "week" | "goals"` (not saved).

- [ ] **Step 1: Failing tests:** `addMonths("2026-12", 1)` → `"2027-01"`; `addMonths("2026-01", -1)` → `"2025-12"`; `monthHeader("2026-10")` → `"October Goals:"`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** `TopBar` shows `[ Week ] [ Goals ]`; week arrows and stats only on Week. `GoalsPage`: `monthHeader`, ◀ ▶ months (starts at this month), then `goalsForMonth` as a plain list: checkbox + title only, `.done` style; checking toggles the same goal's `done`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check in browser.

---

### Task 12: Stats

Branch `stats` · Commit `Show done count for the week`

**Files:**
- Create: `src/lib/stats.js`, `src/lib/stats.test.js`
- Modify: `src/components/TopBar.jsx`

**Interfaces:**
- Consumes: `occursOn`, `activeRepeats`, `weekDays`
- Produces: `weekStats({ tasks, repeats, goals }, weekStartIso) -> { done, total }` (tasks dated in the week + each active repeat occurrence in the week; a repeat occurrence counts as done if its date is in `doneDates`).

- [ ] **Step 1: Failing test:** week `2026-10-11`; tasks: 2 in week (1 done), 1 outside; repeat Tue/Thu with `doneDates ["2026-10-13"]` → `{ done: 2, total: 4 }`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement**; `TopBar` shows "✅ {done} of {total} done this week" for the viewed week (hidden when total is 0).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.

---

### Task 13: Dark mode

Branch `dark-mode` · Commit `Add dark mode`

**Files:** Modify `src/App.jsx`, `src/App.css`, `src/components/TopBar.jsx`, `src/lib/storage.test.js`

**Interfaces:**
- Consumes: `state.theme` from `DEFAULT_STATE`

- [ ] **Step 1: Failing test:** saved state with `theme: "dark"` round-trips through `saveState`/`loadState` and an old saved state without `theme` loads as `"light"`.
- [ ] **Step 2: Run** `npm test`. Expected: the old-state case FAILS only if Task 2 didn't fill missing keys; fix if so.
- [ ] **Step 3: Implement.** All colors as CSS variables on `:root`, overridden under `[data-theme="dark"]`. `App` sets `document.documentElement.dataset.theme = state.theme`. 🌙/☀️ button in `TopBar` toggles it.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Check both themes in browser, including priority tags, today highlight and done style.
