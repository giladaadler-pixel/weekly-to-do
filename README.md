# weekly-to-do
a weekly to do list Im building to get a good feel for github

Live at https://giladaadler-pixel.github.io/weekly-to-do/

## Features

### Today page
- Today's date, a 🔥 streak of days where you finished everything, and "X of Y done today"
- Today's tasks and repeats, Overdue, your goals, and a "This week" box with a dot per day
- Opens first on a phone or as a home-screen app

### Week page
- Sunday to Friday, laid out as a 2×3 grid that fits on one screen
- ◀ / ▶ to move between weeks, and a **This week** button to jump back to this week
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

### Notes
- Dated notes for each goal, plus general notes, newest first
- Each goal shows its progress (for checklists) and a "📝 N" count on its chip that opens its notes
- Click a note to edit it; deleting asks first. Deleting a goal deletes its notes too

### Sidebar
- Pages live in a sidebar on the left, with ☰ at the top left of the screen
- ☰ opens and closes it (there's no ✕)
- On a laptop it's a thin icon strip: hover to peek, click anywhere on it or ☰ to pin it open (it stays pinned next visit), ☰ again to tuck it away
- On a phone, ☰ slides it in from the left; ☰ again, tapping outside it, Escape, or picking a page closes it

### Everything else
- **⬇️ Export backup** / **⬆️ Import backup** in the sidebar save everything to a file and load it back
- Light and dark mode
- Everything is saved in your browser, so it's still there next visit

## Install on your phone
It installs as a home-screen app that opens full screen and works offline.

- **iPhone:** open the site in Safari → Share → **Add to Home Screen**
- **Android:** open the site in Chrome → ⋮ menu → **Install app**

The installed app keeps its own copy of your tasks, separate from the browser's. To bring existing
tasks over: in the browser, open the sidebar and tap **⬇️ Export backup**; then in the installed app,
tap **⬆️ Import backup** and pick that file.

## Running it locally
```
npm install
npm run dev
npm test
```
