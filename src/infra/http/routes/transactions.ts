import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateTransactionCommand } from "../../../commands/create-transaction.js";
import { GetTransactionQuery } from "../../../queries/get-transaction.js";
import { DomainError } from "../../../domain/errors/domain-errors.js";
import { AccountRepository } from "../../database/account-repository.js";
import { TransactionRepository } from "../../database/transaction-repository.js";
import { prisma } from "../../database/prisma-client.js";
import { InMemoryEventBus } from "../../../events/event-bus.js";

const createTransactionSchema = z.object({
  type: z.literal("internal_transfer"),
  originAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  description: z.string().optional(),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

export function registerTransactionRoutes(
  app: FastifyInstance,
  eventBus: InMemoryEventBus,
) {
  const accounts = new AccountRepository(prisma);
  const transactions = new TransactionRepository(prisma);
  const createTransaction = new CreateTransactionCommand(prisma, accounts, eventBus);
  const getTransaction = new GetTransactionQuery(transactions);

  app.post("/transactions", async (request, reply) => {
    const body = createTransactionSchema.parse(request.body);

    try {
      const result = await createTransaction.execute(body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.get("/transactions/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);

    try {
      const result = await getTransaction.execute(id);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });
}
