import { Range, StatsImpl } from "./stats";
// polar.ts and vector.ts mutually import each other; all cross-references are inside method bodies so there is no initialization-order issue
import { Vector, VectorImpl } from "./vector";

export type Polar = {
  r: number;
  a: number;
};

export type PolarRange = {
  r: Range;
  a: Range;
};

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
