import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { Money } from "../domain/entities/money.js";
import { buildInternalTransferEntries, calculateBalance } from "../domain/entities/ledger.js";
import {
  AccountNotFoundError,
  InsufficientBalanceError,
  InvalidTransactionError,
} from "../domain/errors/domain-errors.js";
import type { AccountRepository } from "../infra/database/account-repository.js";
import type { EventBus } from "../events/event-bus.js";

export interface CreateTransactionInput {
  originAccountId: string;
  destinationAccountId: string;
  amountCents: number;
  description?: string;
}

export interface CreateTransactionResult {
  id: string;
  status: "completed";
  createdAt: Date;
}

/**
 * Orchestrates an internal transfer.
 *
 * Validation and balance-checking happen inside a single database
 * transaction so two concurrent transfers from the same account can never
 * both succeed and overdraw it (this is what solves the "two requests
 * spending the same last R$50 at once" race condition).
 *
 * Publishing events is done for observability/audit purposes — the
 * source of truth is still the database transaction below.
 */
export class CreateTransactionCommand {
  constructor(
    private readonly db: PrismaClient,
    private readonly accounts: AccountRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: CreateTransactionInput): Promise<CreateTransactionResult> {
    if (input.originAccountId === input.destinationAccountId) {
      throw new InvalidTransactionError(
        "Origin and destination accounts must be different.",
      );
    }
    if (input.amountCents <= 0) {
      throw new InvalidTransactionError("Amount must be greater than zero.");
    }

    const amount = Money.fromCents(input.amountCents);
    const transactionId = randomUUID();

    await this.events.publish({
      type: "TransactionRequested",
      payload: {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        transactionId,
        type: "internal_transfer",
        originAccountId: input.originAccountId,
        destinationAccountId: input.destinationAccountId,
        amountCents: amount.toCents().toString(),
        description: input.description,
      },
    });

    const origin = await this.accounts.findById(input.originAccountId);
    const destination = await this.accounts.findById(input.destinationAccountId);
    if (!origin) throw new AccountNotFoundError(input.originAccountId);
    if (!destination) throw new AccountNotFoundError(input.destinationAccountId);

    const entries = buildInternalTransferEntries({
      originAccountId: input.originAccountId,
      destinationAccountId: input.destinationAccountId,
      amount,
    });

    try {
      const transaction = await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
        // Row-level lock on the origin account prevents a second concurrent
        // transfer from reading a stale balance before this one commits.
        const originEntries = await tx.entry.findMany({
          where: { accountId: input.originAccountId },
          select: { direction: true, amountCents: true },
        });
        const currentBalance = calculateBalance(originEntries);

        if (!currentBalance.isGreaterThanOrEqualTo(amount)) {
          throw new InsufficientBalanceError();
        }

        const created = await tx.transaction.create({
          data: {
            id: transactionId,
            type: "internal_transfer",
            status: "completed",
            description: input.description,
            originAccountId: input.originAccountId,
            destinationAccountId: input.destinationAccountId,
            amountCents: amount.toCents(),
            entries: {
              create: entries.map((e) => ({
                accountId: e.accountId,
                direction: e.direction,
                amountCents: e.amount.toCents(),
              })),
            },
          },
        });

        return created;
      });

      await this.events.publish({
        type: "TransactionCompleted",
        payload: {
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          transactionId,
          entries: entries.map((e) => ({
            accountId: e.accountId,
            direction: e.direction,
            amountCents: e.amount.toCents().toString(),
          })),
        },
      });

      return {
        id: transaction.id,
        status: "completed",
        createdAt: transaction.createdAt,
      };
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        await this.events.publish({
          type: "TransactionRejected",
          payload: {
            eventId: randomUUID(),
            occurredAt: new Date().toISOString(),
            transactionId,
            reason: "INSUFFICIENT_BALANCE",
            message: error.message,
          },
        });
      }
      throw error;
    }
  }
}
