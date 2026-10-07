import Fastify, { type FastifyInstance } from "fastify";
import { InMemoryEventBus } from "./events/event-bus.js";
import { registerTransactionRoutes } from "./infra/http/routes/transactions.js";
import { registerAccountRoutes } from "./infra/http/routes/accounts.js";
import { registerUserRoutes } from "./infra/http/routes/users.js";

/**
 * Builds a fully configured Fastify instance, without starting an HTTP
 * listener. Used both by main.ts (which adds .listen()) and by
 * integration tests (which use app.inject() instead of a real port).
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  const eventBus = new InMemoryEventBus();

  eventBus.subscribe((event) => {
    app.log.info({ event: event.type, payload: event.payload }, "event published");
  });

  registerTransactionRoutes(app, eventBus);
  registerAccountRoutes(app);
  registerUserRoutes(app);

  return app;
}
