// Backward-compatibility shim — prefer importing Vec2/Vec2Impl from ./vec2 directly.
export type { Vec2 as Vector, Vec2Range as VectorRange, Box } from "./vec2";
export { Vec2Impl as VectorImpl } from "./vec2";
