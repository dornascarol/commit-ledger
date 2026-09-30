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

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User ${userId} not found.`, "USER_NOT_FOUND");
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found.`, "TRANSACTION_NOT_FOUND");
  }
}

export class DuplicateCpfError extends DomainError {
  constructor() {
    super("A user with this CPF already exists.", "DUPLICATE_CPF");
  }
}

export class InvalidTransactionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_TRANSACTION");
  }
}
