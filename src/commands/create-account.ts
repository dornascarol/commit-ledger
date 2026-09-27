import {
  MaxAccountsExceededError,
  UserNotFoundError,
} from "../domain/errors/domain-errors.js";
import type { AccountRepository } from "../infra/database/account-repository.js";
import type { UserRepository } from "../infra/database/user-repository.js";

export interface CreateAccountInput {
  userId: string;
}

export class CreateAccountCommand {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(input: CreateAccountInput) {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const reachedLimit = await this.accounts.hasReachedMaxAccounts(input.userId);
    if (reachedLimit) {
      throw new MaxAccountsExceededError();
    }

    return this.accounts.create({ userId: input.userId });
  }
}
