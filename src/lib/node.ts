import { EntityState } from "./d3-graphics";
import { Vector } from "./math";
import { Publisher } from "./pubsub";

export type Node = {
  id: string;
  position: Vector;
  velocity: Vector;
  publisher: Publisher<EntityState>;
};
