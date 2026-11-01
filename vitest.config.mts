import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror tsconfig's `@/*` path without matching scoped packages
    // such as `@testing-library/*`.
    alias: [{ find: /^@\//, replacement: root }],
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
    // Pure helpers run in Node; component tests opt into jsdom per file
    // with a `// @vitest-environment jsdom` docblock.
    environment: "node",
    // next-intl/middleware imports "next/server" without an extension, which
    // Node ESM rejects; inlining lets Vite resolve it (routing tests).
    server: { deps: { inline: ["next-intl"] } },
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
