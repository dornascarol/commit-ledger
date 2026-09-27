import { describe, expect, it } from "vitest";
import { Money } from "../src/domain/entities/money.js";
import {
  buildInternalTransferEntries,
  calculateBalance,
} from "../src/domain/entities/ledger.js";

describe("buildInternalTransferEntries", () => {
  it("creates one debit and one credit for the same amount", () => {
    const entries = buildInternalTransferEntries({
      originAccountId: "acc-1",
      destinationAccountId: "acc-2",
      amount: Money.fromCents(5000),
    });

    expect(entries).toHaveLength(2);

    const debit = entries.find((e) => e.direction === "debit")!;
    const credit = entries.find((e) => e.direction === "credit")!;

    expect(debit.accountId).toBe("acc-1");
    expect(credit.accountId).toBe("acc-2");
    expect(debit.amount.equals(credit.amount)).toBe(true);
  });
});

describe("calculateBalance", () => {
  it("increases balance on credit and decreases on debit", () => {
    const balance = calculateBalance([
      { direction: "credit", amountCents: 10_000n },
      { direction: "debit", amountCents: 3_000n },
      { direction: "credit", amountCents: 500n },
    ]);

    expect(balance.toCents()).toBe(7_500n);
  });

  it("returns zero for an account with no entries", () => {
    const balance = calculateBalance([]);
    expect(balance.toCents()).toBe(0n);
  });
});

describe("Money", () => {
  it("never allows a negative amount", () => {
    expect(() => Money.fromCents(-100)).toThrow();
  });

  it("formats cents as a BRL string", () => {
    expect(Money.fromCents(1050).toBRLString()).toBe("R$ 10.50");
  });
});
