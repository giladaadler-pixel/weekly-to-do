import "./App.css";
import { todayISO, weekStart } from "./lib/dates.js";
import WeekView from "./components/WeekView.jsx";

export default function App() {
  const todayIso = todayISO();
  return (
    <>
      <h1>My Week</h1>
      <WeekView weekStartIso={weekStart(todayIso)} todayIso={todayIso} />
    </>
  );
}
