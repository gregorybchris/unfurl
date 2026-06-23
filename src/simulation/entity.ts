import { Publisher } from "@/events/pubsub";
import { Vector } from "@/math/math";

// The state a simulation body publishes to observers (e.g. the renderer).
export interface EntityState {
  id: string;
  position: Vector;
}

// The contract a renderable simulation body satisfies. `D3Graphics` is generic
// over this so it stays decoupled from the concrete `Body` type.
export interface IEntity {
  id: string;
  position: Vector;
  pinned?: boolean;
  publisher: Publisher<EntityState>;
}
