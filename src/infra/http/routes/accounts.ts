import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { GetBalanceQuery } from "../../../queries/get-balance.js";
import { GetAccountEntriesQuery } from "../../../queries/get-account-entries.js";
import { CreateAccountCommand } from "../../../commands/create-account.js";
import { DomainError } from "../../../domain/errors/domain-errors.js";
import { AccountRepository } from "../../database/account-repository.js";
import { UserRepository } from "../../database/user-repository.js";
import { prisma } from "../../database/prisma-client.js";

const idParamsSchema = z.object({ id: z.string().uuid() });
const createAccountSchema = z.object({ userId: z.string().uuid() });
const listEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export function registerAccountRoutes(app: FastifyInstance) {
  const accounts = new AccountRepository(prisma);
  const users = new UserRepository(prisma);
  const getBalance = new GetBalanceQuery(accounts);
  const getEntries = new GetAccountEntriesQuery(accounts);
  const createAccount = new CreateAccountCommand(accounts, users);

  app.post("/accounts", async (request, reply) => {
    const body = createAccountSchema.parse(request.body);

    try {
      const account = await createAccount.execute(body);
      return reply.status(201).send(account);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.get("/accounts/:id/balance", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);

    try {
      const result = await getBalance.execute(id);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.get("/accounts/:id/entries", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const query = listEntriesQuerySchema.parse(request.query);

    try {
      const result = await getEntries.execute({ accountId: id, ...query });
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });
}
