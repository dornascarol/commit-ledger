import type { LedgerEvent } from "./events.js";

type Handler = (event: LedgerEvent) => Promise<void> | void;

/**
 * A minimal in-memory event bus.
 *
 * This is intentionally the simplest possible implementation of the
 * EventBus interface below. Swapping it for RabbitMQ, SQS, or Kafka later
 * only means writing a new class that implements `publish`/`subscribe` —
 * nothing in the commands or queries layer needs to change.
 */
export interface EventBus {
  publish(event: LedgerEvent): Promise<void>;
  subscribe(handler: Handler): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers: Handler[] = [];

  subscribe(handler: Handler): void {
    this.handlers.push(handler);
  }

  async publish(event: LedgerEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}
