// vite.config.js (Con 'base' restaurado)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Asegúrate de tener @vitejs/plugin-react@latest compatible con Vite 5

export default defineConfig({
  plugins: [react()],
  base: "/aws-contract-analyzer/", // <-- RESTAURADO
  server: {
    proxy: { "/analyze": "http://localhost:5000" },
  },
  // Asegúrate de NO tener la sección css: { postcss: ... } aquí
});
