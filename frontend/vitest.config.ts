import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// configuracion de los tests del front: corren en jsdom (un navegador simulado)
// y viven en la carpeta tests/, fuera de src, para no entrar en el build.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    css: false,
    testTimeout: 10000,
  },
});
