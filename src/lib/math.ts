export const INF = Number.MAX_SAFE_INTEGER;

export function linear(m: number, b: number, x: number): number {
  return m * x + b;
}

export function exponential(a: number, b: number, x: number): number {
  return a * Math.pow(b, x);
}

export function logistic(a: number, b: number, x: number): number {
  return a / (1 + Math.exp(-b * x));
}

export function logarithmic(a: number, b: number, x: number): number {
  return a * Math.log(x) + b;
}

export type Vector = {
  x: number;
  y: number;
};

export class Vec {
  static add(v1: Vector, v2: Vector): Vector {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
  }

  static mult(v: Vector, s: number): Vector {
    return { x: v.x * s, y: v.y * s };
  }

  static sub(v1: Vector, v2: Vector): Vector {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }

  static mag(v: Vector): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static normalize(v: Vector): Vector {
    const mag = Vec.mag(v);
    return Vec.mult(v, 1 / mag);
  }
}
