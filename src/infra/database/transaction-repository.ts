import type { PrismaClient } from "@prisma/client";

export class TransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.transaction.findUnique({
      where: { id },
      include: { entries: true },
    });
  }
}
