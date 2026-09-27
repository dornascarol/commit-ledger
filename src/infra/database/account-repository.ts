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

  async create(data: { userId: string }) {
    const accountNumber = await this.generateAccountNumber();
    return this.db.account.create({
      data: { userId: data.userId, accountNumber, agency: "1", bank: "1" },
    });
  }

  async getBalance(accountId: string): Promise<Money> {
    const entries = await this.db.entry.findMany({
      where: { accountId },
      select: { direction: true, amountCents: true },
    });

    return calculateBalance(entries);
  }

  async listEntries(accountId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;

    const [data, total] = await Promise.all([
      this.db.entry.findMany({
        where: { accountId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { transaction: { select: { description: true } } },
      }),
      this.db.entry.count({ where: { accountId } }),
    ]);

    return { data, total };
  }

  /**
   * Generates a simple sequential-looking account number.
   * Good enough for the MVP; a production system would want a more
   * robust, collision-proof scheme (e.g. a dedicated sequence table).
   */
  private async generateAccountNumber(): Promise<string> {
    const count = await this.db.account.count();
    const sequence = (count + 1).toString().padStart(7, "0");
    return `${sequence}`;
  }
}

