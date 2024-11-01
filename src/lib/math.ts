import random from "random";

export const INF = Number.MAX_SAFE_INTEGER;

export type Vector = {
  x: number;
  y: number;
};

export type Range = {
  min: number;
  max: number;
};

export type VectorRange = {
  x: Range;
  y: Range;
};

export type PolarRange = {
  r: Range;
  a: Range;
};

export type Polar = {
  r: number;
  a: number;
};

export type Box = {
  width: number;
  height: number;
};

export class StatsImpl {
  static mean(values: number[]): number {
    if (values.length === 0) {
      console.error("Cannot take mean of array of length zero");
      return NaN;
    }

    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return sum / values.length;
  }

  static scale(value: number, rangeA: Range, rangeB: Range): number {
    if (rangeA.max === rangeA.min) {
      console.error("Cannot scale using range with zero width");
      return NaN;
    }
    return ((value - rangeA.min) / (rangeA.max - rangeA.min)) * (rangeB.max - rangeB.min) + rangeB.min;
  }

  static rand(range: Range): number {
    return random.float(range.min, range.max);
  }

  static clip(value: number, range: Range): number {
    if (value < range.min) return range.min;
    if (value > range.max) return range.max;
    return value;
  }

  static wrap(value: number, range: Range): number {
    return StatsImpl.mod(value - range.min, range.max - range.min) + range.min;
  }

  static mod(a: number, b: number) {
    return ((a % b) + b) % b;
  }
}

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

    return {
      x: StatsImpl.mean(vectors.map((p) => p.x)),
      y: StatsImpl.mean(vectors.map((p) => p.y)),
    };
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
}

export class PolarImpl {
  static origin(): Polar {
    return { r: 0, a: 0 };
  }

  static toRect(polar: Polar): Vector {
    return {
      x: polar.r * Math.cos(polar.a),
      y: polar.r * Math.sin(polar.a),
    };
  }

  static add(polarA: Polar, polarB: Polar): Polar {
    return VectorImpl.toPolar(VectorImpl.add(PolarImpl.toRect(polarA), PolarImpl.toRect(polarB)));
  }

  static mean(polars: Polar[]): Polar {
    if (polars.length === 0) {
      console.error("Cannot take polar mean of array of length zero");
      return { r: NaN, a: NaN };
    }

    return VectorImpl.toPolar(VectorImpl.mean(polars.map(PolarImpl.toRect)));
  }

  static addVector(polar: Polar, vector: Vector): Polar {
    return PolarImpl.add(polar, VectorImpl.toPolar(vector));
  }

  static mult(polar: Polar, scaler: number): Polar {
    return {
      r: polar.r * scaler,
      a: polar.a,
    };
  }

  static clip(polar: Polar, range: Range): Polar {
    return {
      r: StatsImpl.clip(polar.r, range),
      a: polar.a,
    };
  }

  static rand(range: PolarRange): Polar {
    return {
      r: StatsImpl.rand(range.r),
      a: StatsImpl.rand(range.a),
    };
  }

  static randFromRange(range: Range): Polar {
    return PolarImpl.rand({
      r: range,
      a: { min: 0, max: 2 * Math.PI },
    });
  }
}

export class CurveImpl {
  static linear(m: number, b: number, x: number): number {
    return m * x + b;
  }

  static exponential(a: number, b: number, x: number): number {
    return a * Math.pow(b, x);
  }

  static logistic(a: number, b: number, x: number): number {
    return a / (1 + Math.exp(-b * x));
  }

  static logarithmic(a: number, b: number, x: number): number {
    return a * Math.log(x) + b;
  }
}
