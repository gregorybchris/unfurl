import { Vector, VectorImpl, VectorRange } from "./math";

// Square bounding box with center and half-size
export type Box = {
  c: Vector;
  hs: number;
};

export class BoxImpl {
  static boxContains(box: Box, vector: Vector): boolean {
    return VectorImpl.inRange(vector, BoxImpl.toVectorRange(box));
  }

  static boxIntersects(self: Box, other: Box): boolean {
    const combinedHalfSize = self.hs + other.hs;
    return Math.abs(self.c.x - other.c.x) < combinedHalfSize && Math.abs(self.c.y - other.c.y) < combinedHalfSize;
  }

  static toVectorRange(box: Box): VectorRange {
    return {
      x: { min: box.c.x - box.hs, max: box.c.x + box.hs },
      y: { min: box.c.y - box.hs, max: box.c.y + box.hs },
    };
  }

  static fromVectorRange(range: VectorRange): Box {
    const size = Math.max(range.x.max - range.x.min, range.y.max - range.y.min);
    const hs = size / 2;
    return {
      c: { x: range.x.min + hs, y: range.y.min + hs },
      hs: hs,
    };
  }

  static fromRadius(vector: Vector, radius: number): Box {
    return {
      c: vector,
      hs: radius,
    };
  }
}
