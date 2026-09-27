import Fastify from "fastify";
import { InMemoryEventBus } from "./events/event-bus.js";
import { registerTransactionRoutes } from "./infra/http/routes/transactions.js";
import { registerAccountRoutes } from "./infra/http/routes/accounts.js";

const app = Fastify({ logger: true });
const eventBus = new InMemoryEventBus();

// Simple observability: log every event published on the bus.
// This is where a real Kafka/RabbitMQ consumer would plug in later.
eventBus.subscribe((event) => {
  app.log.info({ event: event.type, payload: event.payload }, "event published");
});

registerTransactionRoutes(app, eventBus);
registerAccountRoutes(app);

const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`CommitLedger listening on port ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
