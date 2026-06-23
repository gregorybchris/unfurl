import { Vector, VectorImpl, VectorRange } from "@/math/math";

// Square bounding box with center and half-size
export type QuadBox = {
  center: Vector;
  halfSize: number;
};

export class QuadBoxImpl {
  static boxContains(box: QuadBox, vector: Vector): boolean {
    return VectorImpl.inRange(vector, QuadBoxImpl.toVectorRange(box));
  }

  static boxIntersects(self: QuadBox, other: QuadBox): boolean {
    const combinedHalfSize = self.halfSize + other.halfSize;
    return (
      Math.abs(self.center.x - other.center.x) < combinedHalfSize &&
      Math.abs(self.center.y - other.center.y) < combinedHalfSize
    );
  }

  static toVectorRange(box: QuadBox): VectorRange {
    return {
      x: { min: box.center.x - box.halfSize, max: box.center.x + box.halfSize },
      y: { min: box.center.y - box.halfSize, max: box.center.y + box.halfSize },
    };
  }

  static fromVectorRange(range: VectorRange): QuadBox {
    const size = Math.max(range.x.max - range.x.min, range.y.max - range.y.min);
    const halfSize = size / 2;
    return {
      center: { x: range.x.min + halfSize, y: range.y.min + halfSize },
      halfSize: halfSize,
    };
  }

  static fromRadius(vector: Vector, radius: number): QuadBox {
    return {
      center: vector,
      halfSize: radius,
    };
  }
}
