# weekly-to-do
a weekly to do list Im building to get a good feel for github

Live at https://giladaadler-pixel.github.io/weekly-to-do/

## Features

### Week page
- Sunday to Friday, laid out as a 2×3 grid that fits on one screen
- ◀ / ▶ to move between weeks, and a **Today** button to jump back to this week
- A "✅ X of Y done this week" count in the top bar

### Tasks
- Add a task to any day with **Create new task+**, with a priority (high, medium or low)
- Check off, edit, delete, or drag a task to another day
- Repeating tasks that show up on the days you pick
- An **Overdue** section for unfinished tasks from past days and missed repeats

### Goals
- Create goals with a description (checklist, bullets or paragraph), a priority, an optional deadline, and optional days to show the goal as a task
- Every unfinished goal stays on the Week page until you mark it done
- Marking a goal done plays a short 🎉 burst (skipped if your system has reduced motion turned on)

### Accomplishments
- A 🏆 page listing every finished goal, newest first, with the date it was finished
- **Mark not done** sends a goal back to the Week page

### Everything else
- Light and dark mode
- Everything is saved in your browser, so it's still there next visit

## Running it locally
```
npm install
npm run dev
npm test
```
