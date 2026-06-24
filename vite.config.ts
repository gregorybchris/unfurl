import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/unfurl/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/d3") || id.includes("node_modules/d3-")) return "d3";
          if (id.includes("node_modules/@radix-ui")) return "radix";
        },
      },
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/main.tsx", "src/test/**", "src/vite-env.d.ts"],
    },
  },
});
