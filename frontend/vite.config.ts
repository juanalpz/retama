import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// configuracion de vite: react y tailwind. el servidor de desarrollo usa el
// puerto 5173, que es el origen que el backend tiene permitido por cors.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
