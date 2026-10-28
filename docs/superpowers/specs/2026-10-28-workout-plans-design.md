# Workout plans — design

Date: 2026-10-28
Status: approved; review fixes and answers folded in (2026-10-28)

## Goal

Turn the Gym page into a make-your-own-workout tool: create and edit workout plans
(Push day, Pull day, Leg day, Upper, Lower, Full body, or any name), each a list of
exercises you choose; keep your own exercise list; during a session pick an exercise
from the plan and log weight × reps as you go. A plan can optionally be put on the app's
Day calendar and/or the phone's calendar, once or every week.

## Decisions (from the brainstorm and spec review)

| Question | Decision |
| --- | --- |
| When are sets logged? | As you go, during the session. |
| What is in a plan? | A name and an ordered list of exercise names. No sets/reps/weight targets. |
| Where do plans live? | On the Gym page. |
| Calendar | Both: a block on the in-app Day calendar and a downloadable phone-calendar file. |
| Repeat | One-off, or every week on the chosen day. |
| Layout | Tabs on the Gym page: Workout · Plans · Exercises · History. |
| Rest timer | Log set starts the rest timer automatically — with a plan, with No plan, and with no session at all. |
| Exercise removed from your list but still in a plan | Stays in the plan, marked "removed from your list"; it only leaves the plan when you un-tick it. |

This replaces two choices from the 2026-10-28 Gym layout change: Strength goals move
from the top of the Gym page to the History tab, and logging a set now starts the rest
timer (the GymPage test "logging a set does not start the timer" is updated to match).

## 1. Saved data

All in the existing `weekly-to-do:v1` key; the key is never renamed or wiped.

- `state.gym.plans`: `[{ id, name, exercises: [string] }]`, in display order.
  `gymOf()` defaults it to `[]`, so data saved before this feature loads unchanged.
  Plan names are trimmed; a blank name is refused. Exercises in a plan are unique
  (case-insensitive, via `canonicalLift`).
- Exercises: the built-in `LIFTS` plus `state.gym.customLifts` (unchanged). The
  Exercises tab edits `customLifts`. Removing an exercise from the list keeps its past
  sets, goals, and any plan that still lists it (see the decision above).
- Sets (`state.gym.logs`) are unchanged: `{ id, date, lift, weight, reps }`. PRs,
  strength goals and set history keep working.
- Gym session (`weekly-to-do:gym-session`, separate key) gains `planId` (`null` = No
  plan) and `setsLogged` (sets logged since the session started, starting at 0). Sets
  only store a date, so the session counts its own sets rather than working them out
  from `logs`. A session whose plan was deleted behaves as No plan.
- Day calendar events gain an optional `repeat: "weekly"`. Without it an event is a
  single date, exactly as today.
- Export/Import backup already carries `state.gym` and events, so plans and repeating
  events are included with no format change.

## 2. Tabs, Plans and Exercises

**Tabs.** A row of four pill buttons under "Gym tracker": Workout · Plans · Exercises ·
History, built as a `role="tablist"` of `role="tab"` buttons (arrow keys move between
tabs; each panel is a `role="tabpanel"`). Workout is the default; the last tab is
remembered (local storage, try/catch, falls back to Workout).

- Workout: stats, Log a set, rest timer.
- History: Strength goals panel and Set history panel (moved from the main page as-is).

**Plans tab.**
- One card per plan: name, exercises as small chips, and buttons **Start**, **Edit**,
  **Add to calendar**.
- Empty state and a "Create plan" area: quick-start buttons Push · Pull · Leg · Upper ·
  Lower · Full body (names "Push day", "Pull day", "Leg day", "Upper day", "Lower day",
  "Full body day") plus a text box for any name. Each opens the plan sheet on a new plan.
  A quick-start whose name already exists opens that plan instead of making a duplicate.
- **Plan sheet** (modal, like TaskSheet; Escape and backdrop close it):
  - Name field.
  - All exercises as toggle chips (`aria-pressed`); tapping adds/removes from the plan.
  - "+ New exercise" field: adds to `customLifts` and to this plan.
  - Chosen exercises in order with ▲ / ▼ buttons (labelled "Move Bench press up").
    An exercise no longer in your list still shows here, marked "removed from your
    list", with a toggle to take it out of the plan; saving keeps it unless un-ticked.
  - Save, Cancel, Delete plan (asks "Delete Push day? Your logged sets stay.").
  - Saving with no exercises is allowed (a plan can be filled in later).

**Exercises tab.**
- Text field + Add. Names tidied by `canonicalLift` (trim, collapse spaces, match an
  existing spelling ignoring case); duplicates are not added; blank shows
  "Enter an exercise name".
- List: built-ins first (no remove), then the user's own, each with ✕
  ("Remove Pec fly from your list. Its sets and plans stay.").

## 3. Doing a workout (Workout tab)

1. **Start gym session** opens a chooser: one button per plan plus **No plan**. A plan
   card's Start skips the chooser and switches to the Workout tab.
2. While a session with a plan is on:
   - Header reads "<Plan name> · session on".
   - Log a set shows the plan's exercises as large toggle buttons in plan order (min
     44px tall), the first selected. Each shows today's count: "Bench press · 2 sets".
   - A final **Other exercise…** button reveals the existing Lift dropdown / Other
     field for anything not in the plan.
   - Weight is pre-filled with the last weight logged for the selected exercise
     (empty if none); reps start empty.
   - **Log set** saves the set, shows the existing message ("Logged …" or "New PR — …"),
     adds 1 to the session's `setsLogged`, and starts the rest timer at the current
     rest length.
3. **End session** returns to normal and, if `setsLogged` is above 0, shows a toast:
   "Push day done — 9 sets" ("Gym session done — 9 sets" with No plan).
4. No plan: Log a set keeps today's Lift dropdown; Log set still auto-starts the timer.
   With no session running, Log set also auto-starts the timer (the timer works without
   a session; it just isn't shown on the Week page).
5. Week page session strip shows the plan name: "Push day · 1:12".

## 4. Calendar

**Add to calendar** on a plan card opens a sheet: date (default today), start time
(default 18:00), length (default 60 min), and a "Repeat every week" checkbox.

- **Add to Day calendar**: creates a Day-calendar event titled with the plan name
  (`makeEvent`), with `repeat: "weekly"` when ticked. `eventsOn(events, date)` returns a
  weekly event on its own date and every later date on the same weekday. The Day page
  only reads events through `eventsOn` and deletes by id, so it needs no other change.
  Deleting a weekly event deletes the whole series (the event sheet says "Deletes every
  week"). Toast in the app's date style: "Push day added to Wed, Oct 28".
- **Send to phone calendar**: downloads `<plan-name>.ics` with one VEVENT (floating local
  time like the reminder, a 15-minute alert, `RRULE:FREQ=WEEKLY` when ticked). Built by a
  new `buildWorkoutIcs()` in `lib/ics.js` reusing `escapeText` and line folding. The file
  name drops characters that aren't safe in file names (`/ \ : * ? " < > |`), falling
  back to `workout.ics` if nothing is left.
- Either or both buttons may be used; the sheet stays open until closed.

## Code layout

- `src/lib/plans.js` (new): `makePlan`, `updatePlan`, `deletePlan`, `movePlanExercise`,
  `toggleExercise`, `STARTER_PLANS`, `findPlanByName`.
- `src/lib/gym.js`: `gymOf` adds `plans`; `lastWeight(logs, lift)`; `setsToday`.
- `src/lib/restTimer.js`: `startSession(s, now, planId = null)` keeps `startedAt` and
  stores `planId`; `countSet(s)` adds 1 to `setsLogged`.
- `src/lib/schedule.js`: weekly repeat in `makeEvent` / `eventsOn`.
- `src/lib/ics.js`: `buildWorkoutIcs`; `escapeText` escapes semicolons (fixed
  2026-10-28: it used `"\;"`, which is just `";"` in JavaScript).
- Components (new): `GymTabs`, `GymWorkout`, `GymPlans`, `PlanSheet`, `GymExercises`,
  `GymHistory`, `PlanChooser`, `CalendarSheet`. `GymPage.jsx` becomes the tab shell.
- Styles: existing classes (`panel`, `accent-button`, `ghost-button`, `rest-preset`
  pills, `custom-lift` chips, `modal`); new rules only for the tab row and exercise
  buttons, using existing tokens.

## Error handling

- Blank plan or exercise names are refused with a field error; nothing is saved.
- A plan referencing a removed exercise still shows it; a session whose plan was deleted
  falls back to No plan.
- Corrupt or missing `plans` / `planId` / `setsLogged` / `repeat` values are treated as
  absent.
- Weight/reps validation is unchanged (`makeLog`).

## Testing

Unit (vitest): plans.js functions; `gymOf` on old data without `plans`; `lastWeight`;
weekly `eventsOn`; `buildWorkoutIcs` (with and without RRULE, escaping incl. `;`);
`startSession` keeps `startedAt`; `countSet`.
Component: tab switching and remembered tab; create plan from a quick-start; edit plan
(toggle, reorder, new exercise, removed-from-list exercise kept, delete with confirm);
Exercises add/dupe/remove; session chooser; logging from exercise buttons with
pre-filled weight and timer auto-start (in a session and without one); End session
toast; Add to Day calendar (single and weekly).
`npm test` and `npm run build` must pass before each commit.

## Out of scope

Sets/reps/weight targets per exercise; renaming exercises; editing a single occurrence
of a weekly event; syncing changes back from the phone calendar; plan sharing.
