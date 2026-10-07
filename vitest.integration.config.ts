import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Loaded explicitly here (instead of relying on whatever .env is active
// in the shell) so integration tests always point at the test database,
// never at the one you use for manual Postman testing.
const { parsed } = config({ path: ".env.test" });

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    env: parsed,
    // Integration tests share one real database, so running them in
    // parallel could cause one test's truncate to wipe another test's
    // in-flight data. Single-threaded keeps them safe and predictable.
    poolOptions: {
      threads: { singleThread: true },
    },
  },
});
