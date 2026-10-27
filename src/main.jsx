import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { installClickFx } from "./lib/clickFx.js";

installClickFx();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
