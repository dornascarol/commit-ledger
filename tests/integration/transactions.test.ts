import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("transaction flow (integration)", () => {
  it("creates a user, two accounts, deposits funds, transfers between them, and reflects the correct balances", async () => {
    const app = buildApp();

    const userResponse = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "Carol Silva", cpf: "12345678900" },
    });
    expect(userResponse.statusCode).toBe(201);
    const user = userResponse.json();

    const accountAResponse = await app.inject({
      method: "POST",
      url: "/accounts",
      payload: { userId: user.id },
    });
    const accountBResponse = await app.inject({
      method: "POST",
      url: "/accounts",
      payload: { userId: user.id },
    });
    expect(accountAResponse.statusCode).toBe(201);
    expect(accountBResponse.statusCode).toBe(201);
    const accountA = accountAResponse.json();
    const accountB = accountBResponse.json();

    const depositResponse = await app.inject({
      method: "POST",
      url: `/accounts/${accountA.id}/deposit`,
      payload: { amountCents: 10_000, description: "Initial funds" },
    });
    expect(depositResponse.statusCode).toBe(201);

    const transferResponse = await app.inject({
      method: "POST",
      url: "/transactions",
      payload: {
        type: "internal_transfer",
        originAccountId: accountA.id,
        destinationAccountId: accountB.id,
        amountCents: 4_000,
        description: "Transfer to savings",
      },
    });
    expect(transferResponse.statusCode).toBe(201);

    const balanceAResponse = await app.inject({
      method: "GET",
      url: `/accounts/${accountA.id}/balance`,
    });
    const balanceBResponse = await app.inject({
      method: "GET",
      url: `/accounts/${accountB.id}/balance`,
    });

    expect(balanceAResponse.json().balanceCents).toBe("6000");
    expect(balanceBResponse.json().balanceCents).toBe("4000");
  });

  it("rejects a transfer that would overdraw the origin account", async () => {
    const app = buildApp();

    const user = (
      await app.inject({
        method: "POST",
        url: "/users",
        payload: { name: "Bruno Souza", cpf: "98765432100" },
      })
    ).json();

    const accountA = (
      await app.inject({ method: "POST", url: "/accounts", payload: { userId: user.id } })
    ).json();
    const accountB = (
      await app.inject({ method: "POST", url: "/accounts", payload: { userId: user.id } })
    ).json();

    const response = await app.inject({
      method: "POST",
      url: "/transactions",
      payload: {
        type: "internal_transfer",
        originAccountId: accountA.id,
        destinationAccountId: accountB.id,
        amountCents: 1_000,
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error).toBe("INSUFFICIENT_BALANCE");
  });
});
