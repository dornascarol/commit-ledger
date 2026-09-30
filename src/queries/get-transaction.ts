import { TransactionNotFoundError } from "../domain/errors/domain-errors.js";
import type { TransactionRepository } from "../infra/database/transaction-repository.js";

interface EntryRecord {
  id: string;
  accountId: string;
  direction: string;
  amountCents: bigint;
}

export class GetTransactionQuery {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(transactionId: string) {
    const transaction = await this.transactions.findById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }

    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      originAccountId: transaction.originAccountId,
      destinationAccountId: transaction.destinationAccountId,
      amountCents: transaction.amountCents.toString(),
      createdAt: transaction.createdAt,
      entries: (transaction.entries as EntryRecord[]).map((entry) => ({
        id: entry.id,
        accountId: entry.accountId,
        direction: entry.direction,
        amountCents: entry.amountCents.toString(),
      })),
    };
  }
}
