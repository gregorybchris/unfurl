import { Publisher } from "@/events/pubsub";
import { Vector } from "@/math/math";
import { EntityState } from "./entity";

// A physics body in the force-directed simulation.
export type Body = {
  id: string;
  position: Vector;
  velocity: Vector;
  publisher: Publisher<EntityState>;
};
