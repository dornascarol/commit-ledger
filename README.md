# CommitLedger

An event-driven, double-entry financial ledger, built as a learning project to
practice backend engineering concepts: transactional consistency, event-driven
architecture, and domain modeling for money.

> **Why "CommitLedger"?** A double meaning on purpose: a *commit* in a version
> control sense, and a *commit* in the database-transaction sense — the moment
> a transfer is confirmed and becomes part of the ledger's permanent history.

## What it does (v0.1 — internal transfers)

- Users can register and open up to **two accounts** each (mirroring a
  real-world checking + savings account pair at the same bank).
- Accounts can transfer money to each other using **double-entry bookkeeping**:
  every transaction debits one account and credits another for the exact same
  amount — the two must always balance.
- A transfer that would overdraw the origin account is **rejected**, not
  recorded, and returns `422 Unprocessable Entity`.
- Every transaction publishes domain events (`TransactionRequested`,
  `TransactionCompleted`, `TransactionRejected`), so the write path is
  event-driven from day one, even before a real message broker is introduced.

## Key design decisions

- **Money is always an integer number of cents**, never a float — this avoids
  floating-point rounding errors that could break the debit = credit
  invariant. Formatting to `R$ 10.50` only happens at the API/presentation
  boundary.
- **Balance is never stored directly.** It is always derived by summing an
  account's entries (`SUM(credit) - SUM(debit)`). This keeps the ledger
  auditable — the current balance can always be reconstructed from history.
- **Concurrency safety**: the balance check and the insert of new entries
  happen inside a single database transaction, preventing two simultaneous
  transfers from both reading a stale balance and overdrawing an account.
- **Event bus is pluggable.** `InMemoryEventBus` is the current implementation
  of a small `EventBus` interface; swapping it for RabbitMQ, SQS, or Kafka
  later means writing one new class, with no changes to the commands or
  queries layer.

## Roadmap

- [x] v0.1 — internal transfers between a user's own accounts
- [ ] v0.2 — external transfers (PIX/TED) via a dedicated "external" account
- [ ] Materialized balance (cache) with event-driven invalidation
- [ ] Swap the in-memory event bus for a real broker

## Tech stack

Node.js, TypeScript, Fastify, Prisma, PostgreSQL, Zod, Vitest.

## Getting started

```bash
cp .env.example .env
docker compose up -d          # starts Postgres
npm install
npm run prisma:migrate        # creates the database schema
npm run dev                   # starts the API on http://localhost:3000
```

Run the test suite:

```bash
npm test
```

## API

| Method | Endpoint                  | Description                          |
| ------ | -------------------------- | ------------------------------------- |
| POST   | `/transactions`             | Create an internal transfer           |
| GET    | `/accounts/:id/balance`     | Get an account's current balance      |

### `POST /transactions`

```json
{
  "type": "internal_transfer",
  "originAccountId": "uuid",
  "destinationAccountId": "uuid",
  "amountCents": 5000,
  "description": "Transfer to savings"
}
```

On insufficient balance, responds `422` with:

```json
{ "error": "INSUFFICIENT_BALANCE", "message": "Saldo insuficiente. Você não tem saldo disponível para realizar esta transferência." }
```

## Project structure

```
src/
├── domain/       # entities and business rules, framework-free
├── commands/      # write use cases (e.g. CreateTransactionCommand)
├── queries/       # read use cases (e.g. GetBalanceQuery)
├── events/        # event definitions and the event bus
├── infra/
│   ├── database/  # Prisma client and repositories
│   └── http/      # Fastify routes
└── main.ts
```
