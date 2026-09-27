import { DuplicateCpfError } from "../domain/errors/domain-errors.js";
import type { UserRepository } from "../infra/database/user-repository.js";

export interface CreateUserInput {
  name: string;
  cpf: string;
}

export class CreateUserCommand {
  constructor(private readonly users: UserRepository) {}

  async execute(input: CreateUserInput) {
    const existing = await this.users.findByCpf(input.cpf);
    if (existing) {
      throw new DuplicateCpfError();
    }

    return this.users.create(input);
  }
}
