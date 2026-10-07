import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests need the test database and run via
    // `npm run test:integration` (see vitest.integration.config.ts).
    // Keeping them out of the default run means `npm test` stays fast
    // and never needs Docker/Postgres to be up.
    exclude: ["node_modules/**", "tests/integration/**"],
  },
});
