import { Range, StatsImpl } from "./stats";
// vec2.ts and polar.ts mutually import each other; all cross-references are inside method bodies so there is no initialization-order issue
import { Polar, PolarImpl } from "./polar";

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec2Range = {
  x: Range;
  y: Range;
};

export type Box = {
  width: number;
  height: number;
};

export class Vec2Impl {
  static origin(): Vec2 {
    return { x: 0, y: 0 };
  }

  static add(v1: Vec2, v2: Vec2): Vec2 {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
  }

  static mult(vector: Vec2, scaler: number): Vec2 {
    return { x: vector.x * scaler, y: vector.y * scaler };
  }

  static sub(v1: Vec2, v2: Vec2): Vec2 {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }

  static mag(vector: Vec2): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  static normalize(vector: Vec2): Vec2 {
    const mag = Vec2Impl.mag(vector);
    return Vec2Impl.mult(vector, 1 / mag);
  }

  static toPolar(vector: Vec2): Polar {
    return {
      r: Math.sqrt(vector.x * vector.x + vector.y * vector.y),
      a: Math.atan2(vector.y, vector.x),
    };
  }

  static mean(vectors: Vec2[]): Vec2 {
    if (vectors.length === 0) {
      console.error("Cannot take vector mean of array of length zero");
      return { x: NaN, y: NaN };
    }
    let sx = 0, sy = 0;
    for (let i = 0; i < vectors.length; i++) {
      sx += vectors[i].x;
      sy += vectors[i].y;
    }
    return { x: sx / vectors.length, y: sy / vectors.length };
  }

  static addPolar(vector: Vec2, polar: Polar): Vec2 {
    return Vec2Impl.add(vector, PolarImpl.toRect(polar));
  }

  static scale(vector: Vec2, rangeA: Vec2Range, rangeB: Vec2Range): Vec2 {
    return {
      x: StatsImpl.scale(vector.x, rangeA.x, rangeB.x),
      y: StatsImpl.scale(vector.y, rangeA.y, rangeB.y),
    };
  }

  static rand(range: Vec2Range): Vec2 {
    return {
      x: StatsImpl.rand(range.x),
      y: StatsImpl.rand(range.y),
    };
  }

  static clip(vector: Vec2, range: Vec2Range): Vec2 {
    return {
      x: StatsImpl.clip(vector.x, range.x),
      y: StatsImpl.clip(vector.y, range.y),
    };
  }

  static wrap(vector: Vec2, range: Vec2Range): Vec2 {
    return {
      x: StatsImpl.wrap(vector.x, range.x),
      y: StatsImpl.wrap(vector.y, range.y),
    };
  }

  static dist(v1: Vec2, v2: Vec2): number {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static inRange(vector: Vec2, range: Vec2Range): boolean {
    return vector.x > range.x.min && vector.x <= range.x.max && vector.y > range.y.min && vector.y <= range.y.max;
  }

  static map(vector: Vec2, f: (n: number) => number): Vec2 {
    return { x: f(vector.x), y: f(vector.y) };
  }

  static unitTo(v1: Vec2, v2: Vec2): Vec2 {
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) {
      console.error("Cannot take unit vector to same point");
      return { x: 0, y: 0 };
    }
    return { x: dx / mag, y: dy / mag };
  }
}
