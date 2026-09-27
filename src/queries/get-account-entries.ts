import { AccountNotFoundError } from "../domain/errors/domain-errors.js";
import type { AccountRepository } from "../infra/database/account-repository.js";

export interface GetAccountEntriesInput {
  accountId: string;
  page?: number;
  limit?: number;
}

interface EntryWithTransaction {
  id: string;
  transactionId: string;
  direction: string;
  amountCents: bigint;
  createdAt: Date;
  transaction: { description: string | null };
}

export class GetAccountEntriesQuery {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(input: GetAccountEntriesInput) {
    const account = await this.accounts.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { data, total } = await this.accounts.listEntries(input.accountId, {
      page,
      limit,
    });

    return {
      data: (data as EntryWithTransaction[]).map((entry) => ({
        id: entry.id,
        transactionId: entry.transactionId,
        direction: entry.direction,
        amountCents: entry.amountCents.toString(),
        description: entry.transaction.description,
        createdAt: entry.createdAt,
      })),
      page,
      total,
    };
  }
}
