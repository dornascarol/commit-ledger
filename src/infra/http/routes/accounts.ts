import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { GetBalanceQuery } from "../../../queries/get-balance.js";
import { DomainError } from "../../../domain/errors/domain-errors.js";
import { AccountRepository } from "../../database/account-repository.js";
import { prisma } from "../../database/prisma-client.js";

const paramsSchema = z.object({ id: z.string().uuid() });

export function registerAccountRoutes(app: FastifyInstance) {
  const accounts = new AccountRepository(prisma);
  const getBalance = new GetBalanceQuery(accounts);

  app.get("/accounts/:id/balance", async (request, reply) => {
    const { id } = paramsSchema.parse(request.params);

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
}
