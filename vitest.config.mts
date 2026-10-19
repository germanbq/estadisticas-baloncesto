import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths(), react()],

    test: {
      environment: "node",

      include: ["tests/**/*.test.{ts,tsx}"],

      exclude: [
        ...configDefaults.exclude,
        "tests/e2e/**",
      ],

      testTimeout: 15_000,
      hookTimeout: 15_000,
    },
});