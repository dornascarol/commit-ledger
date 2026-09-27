/**
 * Money is always represented as an integer number of cents.
 * We never use floating point numbers for monetary values, to avoid
 * rounding errors that could break the debit === credit invariant.
 */
export class Money {
  private constructor(private readonly cents: bigint) {
    if (cents < 0n) {
      throw new Error("Money amount cannot be negative.");
    }
  }

  static fromCents(cents: number | bigint): Money {
    return new Money(BigInt(cents));
  }

  toCents(): bigint {
    return this.cents;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  isGreaterThanOrEqualTo(other: Money): boolean {
    return this.cents >= other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  /**
   * Formats to a human-readable BRL string, e.g. 1050n -> "R$ 10.50".
   * This is presentation logic and should live only at the API boundary.
   */
  toBRLString(): string {
    const value = Number(this.cents) / 100;
    return `R$ ${value.toFixed(2)}`;
  }
}
