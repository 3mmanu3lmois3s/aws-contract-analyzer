import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swPath = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swPath, { scope: import.meta.env.BASE_URL }) // 👈 AÑADIDO
      .then((reg) => console.log("[App] SW registrado:", reg))
      .catch((err) => console.error("[App] Error al registrar SW:", err));
  });
} else {
  console.warn("[App] Service Workers no son soportados en este navegador.");
}
//   }