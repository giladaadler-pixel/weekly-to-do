# Workout plans — design

Date: 2026-10-28
Status: approved; review fixes and answers folded in (2026-10-28); layout simplified to
two tabs, plans on Workout, exercises managed in the plan sheet (2026-10-28)

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
| Layout | Two tabs on the Gym page: Workout · History. Plans sit at the top of Workout; exercises are managed in the plan sheet (no Plans or Exercises tab). |
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
- Exercises: the built-in `LIFTS` plus `state.gym.customLifts` (unchanged). The plan
  sheet edits `customLifts` ("+ New exercise" adds, ✕ removes). Removing an exercise from the list keeps its past
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

## 2. Tabs, plans and exercises

**Tabs.** A row of two pill buttons under "Gym tracker": Workout · History, built as a
`role="tablist"` of `role="tab"` buttons (arrow keys move between tabs; each panel is a
`role="tabpanel"`). Workout is the default; the last tab is remembered (local storage,
try/catch). A remembered tab that no longer exists — the old "plans" or "exercises" —
opens Workout.

- Workout: "Your workout plans" at the top, then stats, Log a set and the rest timer
  (Log a set and the rest timer unchanged, including "Other…" in Log a set).
- History: Strength goals panel and Set history panel.

**Your workout plans** (top of the Workout tab, a labelled section).
- One card per plan: name, exercises as small chips, and buttons **Start**, **Edit**,
  **Add to calendar**.
- An **Add workout plan** button opens the plan sheet straight away on a new, empty plan.
- With no plans yet the section shows "No plans yet" and the Add workout plan button.

**Plan sheet** (modal, like TaskSheet; Escape and backdrop close it):
- For a new plan only: name suggestions above the name field — Push · Pull · Leg ·
  Upper · Lower · Full body. Tapping one fills in the name ("Push day", "Pull day",
  "Leg day", "Upper day", "Lower day", "Full body day").
- Name field. Blank shows "Enter a plan name". A name you already have (ignoring case)
  shows "You already have Push day. Pick another name, or edit that one." and nothing is
  saved, so plans aren't duplicated.
- **Suggested exercises** for a starter name (matched ignoring case and extra spaces),
  as toggle chips (`aria-pressed`): tapping adds it to the plan, tapping again takes it
  out. Suggestions only — a new plan starts empty. Any other name shows no suggestions.
  Built-in lift names are used where one exists (Bench press, Squat, Deadlift, Pull-up,
  Overhead press) so history and PRs stay together; the rest are sentence case, and a
  suggestion matching an exercise you already have uses your spelling (`canonicalLift`).
  - Push day: Bench press, Incline dumbbell press, Chest fly, Overhead press, Lateral
    raises, Front raises, Triceps pushdowns, Overhead triceps extensions
  - Pull day: Pull-up, Lat pulldowns, Seated cable rows, Barbell rows, Face pulls,
    Dumbbell bicep curls, Hammer curls, Preacher curls
  - Leg day: Squat, Leg press, Romanian deadlifts, Leg extensions, Leg curls, Walking
    lunges, Standing calf raises, Hip thrusts
  - Full body day: Deadlift, Squat, Bench press, Pull-up, Overhead press, Dumbbell
    lunges, Bent-over rows, Push-ups
  - Upper day: the Push day and Pull day lists together. Lower day: the Leg day list.

  Suggestions are built in (`SUGGESTED_EXERCISES` in `lib/plans.js`) and don't join your
  exercise list until you save a plan with one, or log a set with it. Only exercises a
  save newly adds to the plan join the list (`addedExercises`), so one you removed from
  your list stays removed even if the plan still has it.
- **Other…** (`aria-expanded`) opens the full exercise list and "+ New exercise"; it's
  closed when the sheet opens. In it:
- All exercises as toggle chips (`aria-pressed`); tapping adds/removes from the plan.
  Each of your own exercises (not the built-ins) has a small ✕ ("Remove Pec fly from
  your list. Its sets and plans stay.") that removes it from your list — its sets stay,
  and it stays in any plan that uses it (marked, see below).
- "+ New exercise" field: tidied by `canonicalLift` (trim, collapse spaces, match an
  existing spelling ignoring case); adds to `customLifts` and to this plan. Blank shows
  "Enter an exercise name".
- Chosen exercises in order with ▲ / ▼ buttons (labelled "Move Bench press up").
  An exercise no longer in your list still shows here, marked "removed from your
  list", with a toggle to take it out of the plan; saving keeps it unless un-ticked.
- Save, Cancel, Delete plan (asks "Delete Push day? Your logged sets stay.").
- Saving with no exercises is allowed (a plan can be filled in later).

## 3. Doing a workout (Workout tab)

1. **Start gym session** opens a chooser: one button per plan plus **No plan** (with no
   plans it starts straight away with No plan). A plan card's Start skips the chooser.
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
  `toggleExercise`, `STARTER_PLANS`, `findPlanByName`, `SUGGESTED_EXERCISES`,
  `suggestionsFor`, `addedExercises`.
- `src/lib/gym.js`: `gymOf` adds `plans`; `lastWeight(logs, lift)`; `setsToday`.
- `src/lib/restTimer.js`: `startSession(s, now, planId = null)` keeps `startedAt` and
  stores `planId`; `countSet(s)` adds 1 to `setsLogged`.
- `src/lib/schedule.js`: weekly repeat in `makeEvent` / `eventsOn`.
- `src/lib/ics.js`: `buildWorkoutIcs`; `escapeText` escapes semicolons (fixed
  2026-10-28: it used `"\;"`, which is just `";"` in JavaScript).
- Components (new): `GymTabs`, `GymWorkout`, `GymPlans` ("Your workout plans"),
  `PlanSheet` (also manages exercises), `GymHistory`, `PlanChooser`, `CalendarSheet`.
  `GymPage.jsx` is the tab shell. (`GymExercises` and the Plans/Exercises tabs were
  removed when the layout was simplified.)
- Styles: existing classes (`panel`, `accent-button`, `ghost-button`, `rest-preset`
  pills, `modal`); new rules only for the tab row, plan cards, the chip ✕ and exercise
  buttons, using existing tokens.

## Error handling

- Blank plan or exercise names, and a new or renamed plan with a name you already have,
  are refused with a field error; nothing is saved.
- A plan referencing a removed exercise still shows it; a session whose plan was deleted
  falls back to No plan.
- Corrupt or missing `plans` / `planId` / `setsLogged` / `repeat` values are treated as
  absent.
- Weight/reps validation is unchanged (`makeLog`).

## Testing

Unit (vitest): plans.js functions (incl. suggestions per name, built-in spellings,
`addedExercises`); `gymOf` on old data without `plans`; `lastWeight`;
weekly `eventsOn`; `buildWorkoutIcs` (with and without RRULE, escaping incl. `;`);
`startSession` keeps `startedAt`; `countSet`.
Component: two tabs, switching and remembered tab (old "plans"/"exercises" open
Workout); "No plans yet"; plan cards' buttons; Add workout plan with a name suggestion;
suggested exercises (start empty, tap in/out, other names show only Other…, your
spelling wins, Upper = push + pull); Other… opens the full list;
blank and duplicate plan names refused; edit plan (toggle, reorder, new exercise,
removed-from-list exercise kept, delete with confirm); ✕ removes only your own
exercises and doesn't change the plan; session chooser; logging from exercise buttons with
pre-filled weight and timer auto-start (in a session and without one); End session
toast; Add to Day calendar (single and weekly).
`npm test` and `npm run build` must pass before each commit.

## Out of scope

Sets/reps/weight targets per exercise; renaming exercises; editing a single occurrence
of a weekly event; syncing changes back from the phone calendar; plan sharing.
