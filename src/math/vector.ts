import { Range, StatsImpl } from "./stats";
// vector.ts and polar.ts mutually import each other; all cross-references are inside method bodies so there is no initialization-order issue
import { Polar, PolarImpl } from "./polar";

export type Vector = {
  x: number;
  y: number;
};

export type VectorRange = {
  x: Range;
  y: Range;
};

export type Box = {
  width: number;
  height: number;
};

export class VectorImpl {
  static origin(): Vector {
    return { x: 0, y: 0 };
  }

  static add(v1: Vector, v2: Vector): Vector {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
  }

  static mult(vector: Vector, scaler: number): Vector {
    return { x: vector.x * scaler, y: vector.y * scaler };
  }

  static sub(v1: Vector, v2: Vector): Vector {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }

  static mag(vector: Vector): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  static normalize(vector: Vector): Vector {
    const mag = VectorImpl.mag(vector);
    return VectorImpl.mult(vector, 1 / mag);
  }

  static toPolar(vector: Vector): Polar {
    return {
      r: Math.sqrt(vector.x * vector.x + vector.y * vector.y),
      a: Math.atan2(vector.y, vector.x),
    };
  }

  static mean(vectors: Vector[]): Vector {
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

  static addPolar(vector: Vector, polar: Polar): Vector {
    return VectorImpl.add(vector, PolarImpl.toRect(polar));
  }

  static scale(vector: Vector, rangeA: VectorRange, rangeB: VectorRange): Vector {
    return {
      x: StatsImpl.scale(vector.x, rangeA.x, rangeB.x),
      y: StatsImpl.scale(vector.y, rangeA.y, rangeB.y),
    };
  }

  static rand(range: VectorRange): Vector {
    return {
      x: StatsImpl.rand(range.x),
      y: StatsImpl.rand(range.y),
    };
  }

  static clip(vector: Vector, range: VectorRange): Vector {
    return {
      x: StatsImpl.clip(vector.x, range.x),
      y: StatsImpl.clip(vector.y, range.y),
    };
  }

  static wrap(vector: Vector, range: VectorRange): Vector {
    return {
      x: StatsImpl.wrap(vector.x, range.x),
      y: StatsImpl.wrap(vector.y, range.y),
    };
  }

  static dist(v1: Vector, v2: Vector): number {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static inRange(vector: Vector, range: VectorRange): boolean {
    return vector.x > range.x.min && vector.x <= range.x.max && vector.y > range.y.min && vector.y <= range.y.max;
  }

  static map(vector: Vector, f: (n: number) => number): Vector {
    return { x: f(vector.x), y: f(vector.y) };
  }

  static unitTo(v1: Vector, v2: Vector): Vector {
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
