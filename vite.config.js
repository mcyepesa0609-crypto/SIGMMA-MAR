import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/SIGMMA-MAR/", // <-- IMPORTANTÍSIMO (incluye slash final)
});
