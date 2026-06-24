import { Range, StatsImpl } from "./stats";
// polar.ts and vec2.ts mutually import each other; all cross-references are inside method bodies so there is no initialization-order issue
import { Vec2, Vec2Impl } from "./vec2";

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

  static toRect(polar: Polar): Vec2 {
    return {
      x: polar.r * Math.cos(polar.a),
      y: polar.r * Math.sin(polar.a),
    };
  }

  static add(polarA: Polar, polarB: Polar): Polar {
    return Vec2Impl.toPolar(Vec2Impl.add(PolarImpl.toRect(polarA), PolarImpl.toRect(polarB)));
  }

  static mean(polars: Polar[]): Polar {
    if (polars.length === 0) {
      console.error("Cannot take polar mean of array of length zero");
      return { r: NaN, a: NaN };
    }

    return Vec2Impl.toPolar(Vec2Impl.mean(polars.map(PolarImpl.toRect)));
  }

  static addVector(polar: Polar, vector: Vec2): Polar {
    return PolarImpl.add(polar, Vec2Impl.toPolar(vector));
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
