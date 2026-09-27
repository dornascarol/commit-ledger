import type { PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: { name: string; cpf: string }) {
    return this.db.user.create({ data });
  }

  async findByCpf(cpf: string) {
    return this.db.user.findUnique({ where: { cpf } });
  }

  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
}
