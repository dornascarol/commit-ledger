import type { PrismaClient } from "@prisma/client";
import { calculateBalance } from "../../domain/entities/ledger.js";
import { Money } from "../../domain/entities/money.js";

const MAX_ACCOUNTS_PER_USER = 2;

export class AccountRepository {
  constructor(private readonly db: PrismaClient) {}

  async countByUserId(userId: string): Promise<number> {
    return this.db.account.count({ where: { userId } });
  }

  async hasReachedMaxAccounts(userId: string): Promise<boolean> {
    const count = await this.countByUserId(userId);
    return count >= MAX_ACCOUNTS_PER_USER;
  }

  async findById(id: string) {
    return this.db.account.findUnique({ where: { id } });
  }

  async getBalance(accountId: string): Promise<Money> {
    const entries = await this.db.entry.findMany({
      where: { accountId },
      select: { direction: true, amountCents: true },
    });

    return calculateBalance(entries);
  }
}
