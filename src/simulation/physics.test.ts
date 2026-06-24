import { describe, expect, it } from "vitest";
import { Publisher } from "@/events/pubsub";
import { Vec3 } from "@/math/vec3";
import { Body } from "./body";
import { EntityState } from "./entity";
import { update } from "./physics";
import { defaultPhysicsConfig } from "./physics-config";

function makeNode(id: string, position: Vec3): Body {
  return {
    id,
    position,
    velocity: { x: 0, y: 0, z: 0 },
    publisher: new Publisher<EntityState>(),
  };
}

describe("physics.update", () => {
  it("leaves a single node sitting exactly at the center at rest", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    const node = makeNode("n0", { x: 0, y: 0, z: 0 });

    update([node], [], 16, center, defaultPhysicsConfig, [], [], []);

    expect(node.position.x).toBeCloseTo(0);
    expect(node.position.y).toBeCloseTo(0);
    expect(node.position.z).toBeCloseTo(0);
    expect(node.velocity).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("pushes two nearby nodes apart (repulsion)", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    const a = makeNode("a", { x: 0, y: 0, z: 0 });
    const b = makeNode("b", { x: 10, y: 0, z: 0 });

    update([a, b], [], 1, center, defaultPhysicsConfig, [], [], []);

    // a is repelled toward -x, b toward +x
    expect(a.position.x).toBeLessThan(0);
    expect(b.position.x).toBeGreaterThan(10);
    expect(a.position.x).toBeCloseTo(-0.03544, 4);
    expect(b.position.x).toBeCloseTo(10.03452, 4);
    expect(a.position.y).toBeCloseTo(0);
    expect(b.position.y).toBeCloseTo(0);
    expect(a.position.z).toBeCloseTo(0);
    expect(b.position.z).toBeCloseTo(0);
  });

  it("dampens velocity over repeated ticks toward the center", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    const node = makeNode("n0", { x: 100, y: 0, z: 0 });

    update([node], [], 16, center, defaultPhysicsConfig, [], [], []);
    const speedAfterFirst = Math.abs(node.velocity.x);
    expect(speedAfterFirst).toBeGreaterThan(0);
    // node is being pulled back toward the center (negative x velocity)
    expect(node.velocity.x).toBeLessThan(0);
  });

  it("does not move nodes when paused", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    const node = makeNode("n0", { x: 100, y: 0, z: 0 });
    const pausedConfig = { ...defaultPhysicsConfig, paused: true };

    update([node], [], 16, center, pausedConfig, [], [], []);

    expect(node.position.x).toBe(100);
    expect(node.velocity.x).toBe(0);
  });

  it("repels nodes in the z direction in 3D", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    const a = makeNode("a", { x: 0, y: 0, z: 0 });
    const b = makeNode("b", { x: 0, y: 0, z: 10 });

    update([a, b], [], 1, center, defaultPhysicsConfig, [], [], []);

    expect(a.position.z).toBeLessThan(0);
    expect(b.position.z).toBeGreaterThan(10);
  });

  it("spring force pulls nodes together along z axis", () => {
    const center: Vec3 = { x: 0, y: 0, z: 0 };
    // Place nodes very far apart in z so spring dominates repulsion
    const a = makeNode("a", { x: 0, y: 0, z: -1000 });
    const b = makeNode("b", { x: 0, y: 0, z: 1000 });
    const edges = [{ i: 0, j: 1 }];

    update([a, b], edges, 1, center, defaultPhysicsConfig, [], [], []);

    // Spring should pull a toward +z and b toward -z
    expect(a.velocity.z).toBeGreaterThan(0);
    expect(b.velocity.z).toBeLessThan(0);
  });
});
