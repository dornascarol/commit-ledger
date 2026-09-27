export interface TransactionRequested {
  eventId: string;
  occurredAt: string;
  transactionId: string;
  type: "internal_transfer";
  originAccountId: string;
  destinationAccountId: string;
  amountCents: string;
  description?: string;
}

export interface TransactionCompleted {
  eventId: string;
  occurredAt: string;
  transactionId: string;
  entries: Array<{
    accountId: string;
    direction: "debit" | "credit";
    amountCents: string;
  }>;
}

export interface TransactionRejected {
  eventId: string;
  occurredAt: string;
  transactionId: string;
  reason: "INSUFFICIENT_BALANCE";
  message: string;
}

export type LedgerEvent =
  | { type: "TransactionRequested"; payload: TransactionRequested }
  | { type: "TransactionCompleted"; payload: TransactionCompleted }
  | { type: "TransactionRejected"; payload: TransactionRejected };
