import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { Money } from "../domain/entities/money.js";
import { AccountNotFoundError, InvalidTransactionError } from "../domain/errors/domain-errors.js";

export interface CreateDepositInput {
  accountId: string;
  amountCents: number;
  description?: string;
}

/**
 * ⚠️ TEST-ONLY SHORTCUT — NOT a model for real money movement.
 *
 * This command creates a single credit entry with NO balancing debit,
 * which breaks the double-entry invariant (debit === credit) that the
 * rest of the system relies on. It exists only so local/manual testing
 * doesn't require a full external-account setup to get funds into an
 * account.
 *
 * Phase 2 (external accounts) will replace every call site of this
 * command with a proper balanced transaction against a system "external"
 * account. Do not build new features on top of this command.
 */
export class CreateDepositCommand {
  constructor(private readonly db: PrismaClient) {}

  async execute(input: CreateDepositInput) {
    if (input.amountCents <= 0) {
      throw new InvalidTransactionError("Amount must be greater than zero.");
    }

    const account = await this.db.account.findUnique({ where: { id: input.accountId } });
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const amount = Money.fromCents(input.amountCents);
    const transactionId = randomUUID();

    const transaction = await this.db.transaction.create({
      data: {
        id: transactionId,
        type: "deposit",
        status: "completed",
        description: input.description ?? "Test-only deposit",
        originAccountId: input.accountId,
        destinationAccountId: input.accountId,
        amountCents: amount.toCents(),
        entries: {
          create: [
            {
              accountId: input.accountId,
              direction: "credit",
              amountCents: amount.toCents(),
            },
          ],
        },
      },
    });

    return {
      id: transaction.id,
      status: transaction.status,
      createdAt: transaction.createdAt,
    };
  }
}
