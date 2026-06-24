import { Publisher } from '@/events/pubsub'
import { Vec3 } from '@/math/vec3'

// The state a simulation body publishes to observers (e.g. the renderer).
export interface EntityState {
  id: string
  position: Vec3
}

// The contract a renderable simulation body satisfies. `D3Graphics` is generic
// over this so it stays decoupled from the concrete `Body` type.
export interface IEntity {
  id: string
  position: Vec3
  pinned?: boolean
  publisher: Publisher<EntityState>
}
