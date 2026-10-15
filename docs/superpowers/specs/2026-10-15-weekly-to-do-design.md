# Weekly To-Do — Design

**Date:** 2026-10-15
**Owner:** Gilad Adler
**Repo:** giladaadler-pixel/weekly-to-do
**Live site:** https://giladaadler-pixel.github.io/weekly-to-do/

## 1. Purpose

A weekly planner built mainly to learn GitHub well, while being useful enough to actually try.

- Built for Gilad; anyone else who visits can use it too.
- Each person's data stays private in their own browser. Nobody sees anyone else's list.
- Used on a laptop. No phone sync, no accounts.

**Success looks like:** every feature below is shipped through its own Issue → branch → pull request → merge, and the live site updates automatically after each merge.

## 2. Tech setup

| Piece | Choice |
|---|---|
| Framework | React, created with Vite |
| Language | Plain JavaScript (no TypeScript) |
| Saving | Browser `localStorage` (per visitor, per browser) |
| Deploy | GitHub Actions workflow: on every push to `main`, build the app and publish it to GitHub Pages |
| Pages setting | Source = "GitHub Actions" (instead of "Deploy from a branch") |
| Tests | Vitest for date logic, run automatically on every pull request by GitHub Actions |

Vite must be configured with `base: "/weekly-to-do/"` so the app works at the Pages URL.

**Trade-off accepted:** data lives in one browser. A different browser or device starts empty, and clearing browser data erases it.

## 3. Pages

A switch at the top moves between two pages:

```
[ Week ]  [ Goals ]
```

### 3.1 Week page

```
Top bar:     ◀  Oct 11 – 17, 2026  ▶     ✅ 12 of 15 done this week     🌙
Goals band:  this month's goal cards, full width, above the days
Day grid:    Sun | Mon | Tue | Wed | Thu | Fri | Sat
```

**Week**
- Weeks run **Sunday → Saturday**.
- ◀ ▶ moves to the previous or next week.
- Today's column is highlighted (only when viewing the current week).

**Tasks** (in each day column)
- Add, check off, edit, delete.
- Priority tag: high, medium, or low (each a different color). Default is medium.
- Order within a day: unfinished tasks first, sorted high → medium → low; completed tasks at the bottom.
- Drag a task onto another day's column to move it to that day.

**Overdue section** (today's column only)
- Below today's tasks, under the heading **"Overdue"**.
- Shows every unfinished task from any earlier day, labeled with its original day (e.g. "Email Ari (Tue)").
- Checking it off marks the task done everywhere.
- The task also still appears in its original day's column.

**Stats** (top bar)
- "X of Y done this week" for the week being viewed.

**Dark mode**
- 🌙 button toggles light/dark. The choice is saved.

**Repeating tasks**
- When adding a task, optionally pick days: ☐ Sun ☐ Mon … ☐ Sat.
- The task then appears on those days every week, starting from the week it was created.
- Each day's copy is checked off separately.
- Deleting a repeating task asks: **"Just this day"** or **"This and all future days."**
- Missed repeating copies appear in Overdue **once**, with a small counter of how many times they were missed (e.g. "Gym 3×"). Goal days (🎯) work the same way.
  - Checking it off makes up **one** missed day: 3× → 2× → 1× → gone (the oldest missed day is marked done).
  - A small **"clear all"** button clears the whole counter at once.

**Goals band**
- Shows goal cards for the month that today falls in, sorted by priority (high → low), completed goals last.
- Each card has:
  - a **title** (the heading) with a ✓ button next to it
  - a priority color tag
  - **"Due …"** if it has a deadline
  - a **description box** for the plan, in one of three styles chosen per goal:
    - **Checklist**: items with checkboxes
    - **Bullets**: plain bullet points
    - **Paragraph**: free text
- A green **"+ Create new goal"** button opens a pop-up (**modal**) with:
  - **Title**
  - **Description** with a style picker (checklist / bullets / paragraph)
  - **Priority**: Low / Medium / High (default Medium)
  - **Done by** (optional): No deadline / End of this week / End of this month / Pick a date…
  - **Show on days** (optional): ☐ Sun ☐ Mon … ☐ Sat
  - **Cancel** / **Create goal** buttons
- A new goal belongs to the month it's created in.

**Goal days**
- If days are picked, the goal's title appears as a task on those days each week (marked with a 🎯), using the same mechanism as repeating tasks.
- It stops appearing once the goal is marked done or its deadline passes.
- Checking a day's copy only checks that day. It does not complete the whole goal.

### 3.2 Goals page

```
October Goals:

☐ Run 50 km
☐ Read 2 books
☑ Learn GitHub        (faded, crossed out, at the bottom)
```

- Header: "**(Month) Goals:**"
- ◀ ▶ to view past or future months.
- Lists goal titles only, each with a checkbox.
- Checking a goal here is the same as checking it on the Week page (same data).

## 4. "Done" style (used everywhere)

Applies to completed **tasks**, **checklist items inside goals**, and **goals**:

- Shows a ✓
- Text crossed out
- Faded
- Moved to the bottom of its list (completed goals move to the end of the goals band)
- Clicking ✓ again undoes it

## 5. Saved data (`localStorage`)

```js
task = {
  id,
  text,
  date,        // "YYYY-MM-DD"
  done,        // true / false
  priority     // "high" | "medium" | "low"
}

repeat = {     // a repeating task or a goal's days
  id,
  text,
  days,        // e.g. [0, 2, 4] = Sun, Tue, Thu
  priority,
  startDate,   // "YYYY-MM-DD"
  endDate,     // "YYYY-MM-DD" or null (set when "all future days" is deleted, or from a goal's deadline)
  goalId,      // null for a normal repeating task
  doneDates,   // ["YYYY-MM-DD", ...] days this copy was checked off
  skipDates,   // ["YYYY-MM-DD", ...] days deleted with "Just this day"
  clearedThrough // "YYYY-MM-DD" or null: "clear all" ignores missed days up to this date
}
// Missed count = chosen days before today, after clearedThrough,
// that are not in doneDates or skipDates.

goal = {
  id,
  title,
  month,       // "YYYY-MM", the month it was created in
  done,        // true / false
  priority,    // "high" | "medium" | "low"
  dueDate,     // "YYYY-MM-DD" or null
  style,       // "checklist" | "bullets" | "paragraph"
  items,       // [{ text, done }] for checklist and bullets
  text         // string, for paragraph
}

theme = "light" | "dark"
```

## 6. Errors and edge cases

- Saved data missing or broken → start with an empty planner instead of crashing.
- Empty task or goal text → ignored, not saved.
- Overdue only counts days **before** today. Future tasks are never overdue.
- Changing a goal's style keeps its items/text where possible (bullets ↔ checklist keep items; switching to or from paragraph converts between lines and items).

## 7. Testing

- **Every pull request:** open the app locally (`npm run dev`) and check the feature by hand before merging.
- **Automated tests (Vitest), run in GitHub Actions on every pull request:**
  - The week containing a given date starts on Sunday.
  - Overdue = unfinished tasks dated before today.
  - "X of Y done" counts only the viewed week.
  - A new goal's month = the month it was created in.
  - A repeating task appears only on its chosen days, between its start and end dates, minus skipped days.
  - The missed counter is correct, goes down by 1 per check, and resets with "clear all".
  - "End of this week" = the coming Saturday; "End of this month" = the month's last day.

## 8. Build order

Each row is one GitHub Issue, built on its own branch and merged with its own pull request.

| # | Feature |
|---|---|
| 0 | Setup: React + Vite app, GitHub Actions deploy workflow, Pages source switched to Actions |
| 1 | Sun–Sat week grid + highlight today |
| 2 | Add / check / edit / delete tasks, saved to localStorage |
| 3 | "Done" style: ✓, crossed out, faded, moved to bottom |
| 4 | Priorities |
| 5 | Week navigation ◀ ▶ |
| 6 | Overdue section in today's column |
| 7 | Drag tasks between days |
| 8 | Repeating tasks (pick days when adding a task) |
| 9 | Goals band + "Create new goal" modal: title, description style, priority, done by, done, month |
| 10 | Goal days: show a goal as a task on chosen days |
| 11 | Goals page + Week/Goals switch |
| 12 | Stats |
| 13 | Dark mode |

## 9. Out of scope (for now)

- Accounts, sign-in, syncing between devices
- Phone-specific layout
- AI suggestion bot for goals
