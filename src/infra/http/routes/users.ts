import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateUserCommand } from "../../../commands/create-user.js";
import { DomainError } from "../../../domain/errors/domain-errors.js";
import { UserRepository } from "../../database/user-repository.js";
import { prisma } from "../../database/prisma-client.js";

const createUserSchema = z.object({
  name: z.string().min(1),
  cpf: z.string().min(11).max(14),
});

export function registerUserRoutes(app: FastifyInstance) {
  const users = new UserRepository(prisma);
  const createUser = new CreateUserCommand(users);

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
}
