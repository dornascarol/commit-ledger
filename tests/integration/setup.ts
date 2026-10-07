import { beforeEach, afterAll } from "vitest";
import { prisma } from "../../src/infra/database/prisma-client.js";

/**
 * Wipes every table before each integration test, so tests never depend
 * on leftover data from a previous run or from each other. Order matters:
 * child tables (entries, transactions) must be cleared before the parent
 * tables (accounts, users) they reference.
 */
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "entries" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "transactions" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "accounts" CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
