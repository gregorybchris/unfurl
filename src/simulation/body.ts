import { Publisher } from "@/events/pubsub";
import { Vec3 } from "@/math/vec3";
import { EntityState } from "./entity";

// A physics body in the force-directed simulation.
export type Body = {
  id: string;
  position: Vec3;
  velocity: Vec3;
  pinned?: boolean;
  publisher: Publisher<EntityState>;
};
