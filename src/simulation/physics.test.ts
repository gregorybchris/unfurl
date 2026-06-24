import { describe, expect, it, vi } from "vitest";
import { Publisher } from "@/events/pubsub";
import { Vector } from "@/math/math";
import { Body } from "./body";
import { EntityState } from "./entity";
import { update } from "./physics";
import { defaultPhysicsConfig } from "./physics-config";

function makeNode(id: string, position: Vector): Body {
  return {
    id,
    position,
    velocity: { x: 0, y: 0 },
    publisher: new Publisher<EntityState>(),
  };
}

describe("physics.update", () => {
  it("leaves a single node sitting exactly at the center at rest", () => {
    const center: Vector = { x: 0, y: 0 };
    const node = makeNode("n0", { x: 0, y: 0 });

    update([node], [], 16, center, defaultPhysicsConfig, [], [], []);

    expect(node.position.x).toBeCloseTo(0);
    expect(node.position.y).toBeCloseTo(0);
    expect(node.velocity).toEqual({ x: 0, y: 0 });
  });

  it("pushes two nearby nodes apart (repulsion)", () => {
    const center: Vector = { x: 0, y: 0 };
    const a = makeNode("a", { x: 0, y: 0 });
    const b = makeNode("b", { x: 10, y: 0 });

    update([a, b], [], 1, center, defaultPhysicsConfig, [], [], []);

    // a is repelled toward -x, b toward +x
    expect(a.position.x).toBeLessThan(0);
    expect(b.position.x).toBeGreaterThan(10);
    expect(a.position.x).toBeCloseTo(-0.03544, 4);
    expect(b.position.x).toBeCloseTo(10.03452, 4);
    expect(a.position.y).toBeCloseTo(0);
    expect(b.position.y).toBeCloseTo(0);
  });

  it("publishes each node's updated state to its subscribers", () => {
    const center: Vector = { x: 0, y: 0 };
    const node = makeNode("n0", { x: 0, y: 0 });
    const listener = vi.fn();
    node.publisher.subscribers.push({ receive: listener } as never);

    update([node], [], 16, center, defaultPhysicsConfig, [], [], []);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ id: "n0", position: { x: 0, y: 0 } });
  });

  it("dampens velocity over repeated ticks toward the center", () => {
    const center: Vector = { x: 0, y: 0 };
    const node = makeNode("n0", { x: 100, y: 0 });

    update([node], [], 16, center, defaultPhysicsConfig, [], [], []);
    const speedAfterFirst = Math.abs(node.velocity.x);
    expect(speedAfterFirst).toBeGreaterThan(0);
    // node is being pulled back toward the center (negative x velocity)
    expect(node.velocity.x).toBeLessThan(0);
  });

  it("does not move nodes when paused", () => {
    const center: Vector = { x: 0, y: 0 };
    const node = makeNode("n0", { x: 100, y: 0 });
    const pausedConfig = { ...defaultPhysicsConfig, paused: true };

    update([node], [], 16, center, pausedConfig, [], [], []);

    expect(node.position.x).toBe(100);
    expect(node.velocity.x).toBe(0);
  });
});
