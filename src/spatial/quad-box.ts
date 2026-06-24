import { Vec2, Vec2Impl, Vec2Range } from '@/math/vec2'

// Square bounding box with center and half-size
export type QuadBox = {
  center: Vec2
  halfSize: number
}

export class QuadBoxImpl {
  static boxContains(box: QuadBox, vector: Vec2): boolean {
    return Vec2Impl.inRange(vector, QuadBoxImpl.toVec2Range(box))
  }

  static boxIntersects(self: QuadBox, other: QuadBox): boolean {
    const combinedHalfSize = self.halfSize + other.halfSize
    return (
      Math.abs(self.center.x - other.center.x) < combinedHalfSize &&
      Math.abs(self.center.y - other.center.y) < combinedHalfSize
    )
  }

  static toVec2Range(box: QuadBox): Vec2Range {
    return {
      x: { min: box.center.x - box.halfSize, max: box.center.x + box.halfSize },
      y: { min: box.center.y - box.halfSize, max: box.center.y + box.halfSize },
    }
  }

  // Keep old name as alias for backward compatibility with existing call sites
  static toVectorRange(box: QuadBox): Vec2Range {
    return QuadBoxImpl.toVec2Range(box)
  }

  static fromVec2Range(range: Vec2Range): QuadBox {
    const size = Math.max(range.x.max - range.x.min, range.y.max - range.y.min)
    const halfSize = size / 2
    return {
      center: { x: range.x.min + halfSize, y: range.y.min + halfSize },
      halfSize: halfSize,
    }
  }

  static fromRadius(vector: Vec2, radius: number): QuadBox {
    return {
      center: vector,
      halfSize: radius,
    }
  }
}
