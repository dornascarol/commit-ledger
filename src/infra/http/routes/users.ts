import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateUserCommand } from "../../../commands/create-user.js";
import { ListUserAccountsQuery } from "../../../queries/list-user-accounts.js";
import { DomainError } from "../../../domain/errors/domain-errors.js";
import { UserRepository } from "../../database/user-repository.js";
import { AccountRepository } from "../../database/account-repository.js";
import { prisma } from "../../database/prisma-client.js";

const createUserSchema = z.object({
  name: z.string().min(1),
  cpf: z.string().min(11).max(14),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

export function registerUserRoutes(app: FastifyInstance) {
  const users = new UserRepository(prisma);
  const accounts = new AccountRepository(prisma);
  const createUser = new CreateUserCommand(users);
  const listUserAccounts = new ListUserAccountsQuery(accounts, users);

  app.post("/users", async (request, reply) => {
    const body = createUserSchema.parse(request.body);

    try {
      const user = await createUser.execute(body);
      return reply.status(201).send(user);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });

  app.get("/users/:id/accounts", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);

    try {
      const result = await listUserAccounts.execute(id);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof DomainError) {
        return reply.status(422).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });
}
