export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super(
      "Saldo insuficiente. Você não tem saldo disponível para realizar esta transferência.",
      "INSUFFICIENT_BALANCE",
    );
  }
}

export class MaxAccountsExceededError extends DomainError {
  constructor() {
    super(
      "Este usuário já possui o número máximo de contas permitido.",
      "MAX_ACCOUNTS_EXCEEDED",
    );
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super(`Account ${accountId} not found.`, "ACCOUNT_NOT_FOUND");
  }
}

export class InvalidTransactionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_TRANSACTION");
  }
}
