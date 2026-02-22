import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    alias: {
      "@": resolve(__dirname, "./src"),
      "@auth": resolve(__dirname, "./auth.ts"),
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
  },
});
