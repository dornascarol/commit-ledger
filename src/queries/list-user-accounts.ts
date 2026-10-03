import { UserNotFoundError } from "../domain/errors/domain-errors.js";
import type { AccountRepository } from "../infra/database/account-repository.js";
import type { UserRepository } from "../infra/database/user-repository.js";

interface AccountRecord {
  id: string;
  accountNumber: string;
  agency: string;
  bank: string;
  createdAt: Date;
}

export class ListUserAccountsQuery {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const accounts = await this.accounts.findByUserId(userId);

    return (accounts as AccountRecord[]).map((account) => ({
      id: account.id,
      accountNumber: account.accountNumber,
      agency: account.agency,
      bank: account.bank,
      createdAt: account.createdAt,
    }));
  }
}
