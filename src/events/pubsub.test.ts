import { describe, expect, it, vi } from "vitest";
import { Publisher, Subscriber } from "./pubsub";

describe("Publisher / Subscriber", () => {
  it("delivers published messages to registered subscribers", () => {
    const publisher = new Publisher<number>();
    const received: number[] = [];
    const subscriber = new Subscriber<number>((message) => received.push(message));

    publisher.register(subscriber);
    publisher.publish(1);
    publisher.publish(2);

    expect(received).toEqual([1, 2]);
  });

  it("broadcasts to every subscriber", () => {
    const publisher = new Publisher<string>();
    const a = vi.fn();
    const b = vi.fn();
    publisher.register(new Subscriber(a));
    publisher.register(new Subscriber(b));

    publisher.publish("hello");

    expect(a).toHaveBeenCalledWith("hello");
    expect(b).toHaveBeenCalledWith("hello");
  });

  it("stops delivering after unregister", () => {
    const publisher = new Publisher<number>();
    const fn = vi.fn();
    const subscriber = new Subscriber<number>(fn);

    publisher.register(subscriber);
    publisher.publish(1);
    publisher.unregister(subscriber);
    publisher.publish(2);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("Subscriber.subscribe / unsubscribe wire up the publisher", () => {
    const publisher = new Publisher<number>();
    const fn = vi.fn();
    const subscriber = new Subscriber<number>(fn);

    subscriber.subscribe(publisher);
    expect(publisher.subscribers).toContain(subscriber);

    publisher.publish(42);
    expect(fn).toHaveBeenCalledWith(42);

    subscriber.unsubscribe(publisher);
    expect(publisher.subscribers).not.toContain(subscriber);
  });

  it("receive invokes the callback directly", () => {
    const fn = vi.fn();
    new Subscriber<string>(fn).receive("x");
    expect(fn).toHaveBeenCalledWith("x");
  });
});
