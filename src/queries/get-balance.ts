import { AccountNotFoundError } from "../domain/errors/domain-errors.js";
import type { AccountRepository } from "../infra/database/account-repository.js";

export class GetBalanceQuery {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(accountId: string) {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new AccountNotFoundError(accountId);

    const balance = await this.accounts.getBalance(accountId);

    return {
      accountId,
      balanceCents: balance.toCents().toString(),
    };
  }
}
