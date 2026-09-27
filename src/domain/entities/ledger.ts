import { Money } from "./money.js";

export type EntryDirection = "debit" | "credit";

export interface EntryInput {
  accountId: string;
  direction: EntryDirection;
  amount: Money;
}

/**
 * Builds the two balanced entries (one debit, one credit) for an internal
 * transfer between two accounts. This is the core double-entry rule:
 * every transaction must debit one account and credit another for the
 * exact same amount.
 */
export function buildInternalTransferEntries(params: {
  originAccountId: string;
  destinationAccountId: string;
  amount: Money;
}): EntryInput[] {
  const { originAccountId, destinationAccountId, amount } = params;

  return [
    { accountId: originAccountId, direction: "debit", amount },
    { accountId: destinationAccountId, direction: "credit", amount },
  ];
}

/**
 * Computes an account balance from its entries.
 * Credit increases the balance, debit decreases it.
 * The balance is always a derived value — never stored and mutated
 * directly — so it can always be reconstructed from history.
 */
export function calculateBalance(
  entries: Array<{ direction: EntryDirection; amountCents: bigint }>,
): Money {
  return entries.reduce((balance, entry) => {
    const amount = Money.fromCents(entry.amountCents);
    return entry.direction === "credit"
      ? balance.add(amount)
      : balance.subtract(amount);
  }, Money.fromCents(0n));
}
