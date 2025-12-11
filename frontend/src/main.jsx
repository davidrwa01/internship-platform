import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./pages/Home.css"; // global style for all pages
import "@fortawesome/fontawesome-free/css/all.min.css"; // icons support

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
