import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Populates the database with a small, realistic set of sample data for
 * local development: two users, two accounts each, an initial deposit,
 * and one internal transfer already executed.
 *
 * Safe to run multiple times: users are upserted by CPF, so re-running
 * this script won't create duplicates. It does NOT touch the test
 * database — that one is truncated fresh by the integration test setup
 * instead (see tests/integration/setup.ts).
 */
async function main() {
  console.log("Seeding database...");

  const carol = await prisma.user.upsert({
    where: { cpf: "11111111111" },
    update: {},
    create: { name: "Carol Silva", cpf: "11111111111" },
  });

  const bruno = await prisma.user.upsert({
    where: { cpf: "22222222222" },
    update: {},
    create: { name: "Bruno Souza", cpf: "22222222222" },
  });

  const carolChecking = await getOrCreateAccount(carol.id, "0000001");
  const carolSavings = await getOrCreateAccount(carol.id, "0000002");
  await getOrCreateAccount(bruno.id, "0000003");

  // Give Carol's checking account some funds to play with, then move
  // part of it to her savings account — mirrors a realistic first
  // session of manual testing in Postman.
  const existingDeposit = await prisma.transaction.findFirst({
    where: { originAccountId: carolChecking.id, type: "deposit" },
  });

  if (!existingDeposit) {
    await prisma.transaction.create({
      data: {
        type: "deposit",
        status: "completed",
        description: "Seed: initial funds",
        originAccountId: carolChecking.id,
        destinationAccountId: carolChecking.id,
        amountCents: 50_000n,
        entries: {
          create: [{ accountId: carolChecking.id, direction: "credit", amountCents: 50_000n }],
        },
      },
    });

    await prisma.transaction.create({
      data: {
        type: "internal_transfer",
        status: "completed",
        description: "Seed: transfer to savings",
        originAccountId: carolChecking.id,
        destinationAccountId: carolSavings.id,
        amountCents: 15_000n,
        entries: {
          create: [
            { accountId: carolChecking.id, direction: "debit", amountCents: 15_000n },
            { accountId: carolSavings.id, direction: "credit", amountCents: 15_000n },
          ],
        },
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Carol  (user ${carol.id})`);
  console.log(`    checking: ${carolChecking.id}`);
  console.log(`    savings:  ${carolSavings.id}`);
  console.log(`  Bruno  (user ${bruno.id})`);
}

async function getOrCreateAccount(userId: string, accountNumber: string) {
  const existing = await prisma.account.findUnique({ where: { accountNumber } });
  if (existing) return existing;

  return prisma.account.create({
    data: { userId, accountNumber, agency: "1", bank: "1" },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
