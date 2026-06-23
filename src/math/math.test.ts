import { afterEach, describe, expect, it, vi } from "vitest";
import { CurveImpl, INF, PolarImpl, StatsImpl, VectorImpl } from "./math";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("INF", () => {
  it("equals Number.MAX_SAFE_INTEGER", () => {
    expect(INF).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("StatsImpl", () => {
  describe("mean", () => {
    it("averages a list of numbers", () => {
      expect(StatsImpl.mean([1, 2, 3, 4])).toBe(2.5);
      expect(StatsImpl.mean([5])).toBe(5);
      expect(StatsImpl.mean([-2, 2])).toBe(0);
    });

    it("returns NaN and logs for an empty array", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(StatsImpl.mean([])).toBeNaN();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("scale", () => {
    it("maps a value from one range to another", () => {
      expect(StatsImpl.scale(5, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(50);
      expect(StatsImpl.scale(0, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(0);
      expect(StatsImpl.scale(10, { min: 0, max: 10 }, { min: -1, max: 1 })).toBe(1);
    });

    it("returns NaN and logs for a zero-width source range", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(StatsImpl.scale(5, { min: 4, max: 4 }, { min: 0, max: 1 })).toBeNaN();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("rand", () => {
    it("stays within the requested range", () => {
      for (let i = 0; i < 100; i++) {
        const value = StatsImpl.rand({ min: 2, max: 5 });
        expect(value).toBeGreaterThanOrEqual(2);
        expect(value).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("clip", () => {
    it("clamps to the range bounds", () => {
      const range = { min: 0, max: 10 };
      expect(StatsImpl.clip(-5, range)).toBe(0);
      expect(StatsImpl.clip(15, range)).toBe(10);
      expect(StatsImpl.clip(5, range)).toBe(5);
    });
  });

  describe("mod", () => {
    it("returns a non-negative remainder", () => {
      expect(StatsImpl.mod(7, 3)).toBe(1);
      expect(StatsImpl.mod(-1, 3)).toBe(2);
      expect(StatsImpl.mod(-4, 3)).toBe(2);
      expect(StatsImpl.mod(6, 3)).toBe(0);
    });
  });

  describe("wrap", () => {
    it("wraps values into the range", () => {
      const range = { min: 0, max: 10 };
      expect(StatsImpl.wrap(11, range)).toBe(1);
      expect(StatsImpl.wrap(-1, range)).toBe(9);
      expect(StatsImpl.wrap(5, range)).toBe(5);
    });

    it("respects a non-zero minimum", () => {
      const range = { min: 5, max: 15 };
      expect(StatsImpl.wrap(16, range)).toBe(6);
      expect(StatsImpl.wrap(4, range)).toBe(14);
    });
  });
});

describe("VectorImpl", () => {
  it("origin is the zero vector", () => {
    expect(VectorImpl.origin()).toEqual({ x: 0, y: 0 });
  });

  it("add / sub / mult", () => {
    expect(VectorImpl.add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(VectorImpl.sub({ x: 3, y: 4 }, { x: 1, y: 2 })).toEqual({ x: 2, y: 2 });
    expect(VectorImpl.mult({ x: 2, y: -3 }, 4)).toEqual({ x: 8, y: -12 });
  });

  it("mag computes magnitude", () => {
    expect(VectorImpl.mag({ x: 3, y: 4 })).toBe(5);
    expect(VectorImpl.mag({ x: 0, y: 0 })).toBe(0);
  });

  it("normalize yields a unit vector", () => {
    const n = VectorImpl.normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(VectorImpl.mag(n)).toBeCloseTo(1);
  });

  it("dist computes euclidean distance", () => {
    expect(VectorImpl.dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(VectorImpl.dist({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it("mean averages vectors", () => {
    expect(VectorImpl.mean([{ x: 0, y: 0 }, { x: 2, y: 4 }])).toEqual({ x: 1, y: 2 });
  });

  it("mean of empty array returns NaN vector and logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = VectorImpl.mean([]);
    expect(result.x).toBeNaN();
    expect(result.y).toBeNaN();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("toPolar converts to polar coordinates", () => {
    const p = VectorImpl.toPolar({ x: 0, y: 2 });
    expect(p.r).toBeCloseTo(2);
    expect(p.a).toBeCloseTo(Math.PI / 2);
  });

  it("scale maps each component independently", () => {
    const result = VectorImpl.scale(
      { x: 5, y: 5 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
      { x: { min: 0, max: 100 }, y: { min: 0, max: 1 } }
    );
    expect(result).toEqual({ x: 50, y: 0.5 });
  });

  it("clip clamps each component", () => {
    const result = VectorImpl.clip(
      { x: -5, y: 50 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } }
    );
    expect(result).toEqual({ x: 0, y: 10 });
  });

  it("wrap wraps each component", () => {
    const result = VectorImpl.wrap(
      { x: 11, y: -1 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } }
    );
    expect(result).toEqual({ x: 1, y: 9 });
  });

  it("inRange checks exclusive-min / inclusive-max bounds", () => {
    const range = { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } };
    expect(VectorImpl.inRange({ x: 5, y: 5 }, range)).toBe(true);
    expect(VectorImpl.inRange({ x: 10, y: 10 }, range)).toBe(true);
    expect(VectorImpl.inRange({ x: 0, y: 5 }, range)).toBe(false);
    expect(VectorImpl.inRange({ x: 11, y: 5 }, range)).toBe(false);
  });

  it("map applies a function to both components", () => {
    expect(VectorImpl.map({ x: 2, y: 3 }, (n) => n * n)).toEqual({ x: 4, y: 9 });
  });

  it("unitTo returns a unit vector pointing from v1 to v2", () => {
    const u = VectorImpl.unitTo({ x: 0, y: 0 }, { x: 0, y: 5 });
    expect(u).toEqual({ x: 0, y: 1 });
  });

  it("unitTo of identical points returns zero vector and logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(VectorImpl.unitTo({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({ x: 0, y: 0 });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("addPolar adds a polar offset to a vector", () => {
    const result = VectorImpl.addPolar({ x: 1, y: 1 }, { r: 2, a: 0 });
    expect(result.x).toBeCloseTo(3);
    expect(result.y).toBeCloseTo(1);
  });

  it("rand stays within the vector range", () => {
    const range = { x: { min: 0, max: 1 }, y: { min: 10, max: 20 } };
    for (let i = 0; i < 50; i++) {
      const v = VectorImpl.rand(range);
      expect(v.x).toBeGreaterThanOrEqual(0);
      expect(v.x).toBeLessThanOrEqual(1);
      expect(v.y).toBeGreaterThanOrEqual(10);
      expect(v.y).toBeLessThanOrEqual(20);
    }
  });
});

describe("PolarImpl", () => {
  it("origin is zero", () => {
    expect(PolarImpl.origin()).toEqual({ r: 0, a: 0 });
  });

  it("toRect converts to cartesian coordinates", () => {
    const v = PolarImpl.toRect({ r: 2, a: 0 });
    expect(v.x).toBeCloseTo(2);
    expect(v.y).toBeCloseTo(0);

    const v2 = PolarImpl.toRect({ r: 1, a: Math.PI / 2 });
    expect(v2.x).toBeCloseTo(0);
    expect(v2.y).toBeCloseTo(1);
  });

  it("toRect/toPolar round-trip", () => {
    const original = { r: 3, a: 1 };
    const back = VectorImpl.toPolar(PolarImpl.toRect(original));
    expect(back.r).toBeCloseTo(original.r);
    expect(back.a).toBeCloseTo(original.a);
  });

  it("mult scales the radius but keeps the angle", () => {
    expect(PolarImpl.mult({ r: 2, a: 1 }, 3)).toEqual({ r: 6, a: 1 });
  });

  it("clip clamps the radius", () => {
    expect(PolarImpl.clip({ r: 50, a: 1 }, { min: 0, max: 10 })).toEqual({ r: 10, a: 1 });
  });

  it("add sums two polar vectors", () => {
    const sum = PolarImpl.add({ r: 2, a: 0 }, { r: 3, a: 0 });
    expect(sum.r).toBeCloseTo(5);
    expect(sum.a).toBeCloseTo(0);
  });

  it("mean of empty array returns NaN polar and logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = PolarImpl.mean([]);
    expect(result.r).toBeNaN();
    expect(result.a).toBeNaN();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("rand stays within the polar range", () => {
    const range = { r: { min: 1, max: 2 }, a: { min: 0, max: Math.PI } };
    for (let i = 0; i < 50; i++) {
      const p = PolarImpl.rand(range);
      expect(p.r).toBeGreaterThanOrEqual(1);
      expect(p.r).toBeLessThanOrEqual(2);
      expect(p.a).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeLessThanOrEqual(Math.PI);
    }
  });

  it("randFromRange uses a full angular sweep", () => {
    for (let i = 0; i < 50; i++) {
      const p = PolarImpl.randFromRange({ min: 0, max: 5 });
      expect(p.r).toBeGreaterThanOrEqual(0);
      expect(p.r).toBeLessThanOrEqual(5);
      expect(p.a).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeLessThanOrEqual(2 * Math.PI);
    }
  });
});

describe("CurveImpl", () => {
  it("linear: y = m*x + b", () => {
    expect(CurveImpl.linear(2, 1, 3)).toBe(7);
    expect(CurveImpl.linear(0, 5, 100)).toBe(5);
  });

  it("exponential: y = a*b^x", () => {
    expect(CurveImpl.exponential(2, 3, 2)).toBe(18);
    expect(CurveImpl.exponential(1, 2, 0)).toBe(1);
  });

  it("logistic: y = a / (1 + e^(-b*x))", () => {
    expect(CurveImpl.logistic(1, 1, 0)).toBeCloseTo(0.5);
    expect(CurveImpl.logistic(10, 1, 0)).toBeCloseTo(5);
  });

  it("logarithmic: y = a*ln(x) + b", () => {
    expect(CurveImpl.logarithmic(1, 0, 1)).toBeCloseTo(0);
    expect(CurveImpl.logarithmic(2, 1, Math.E)).toBeCloseTo(3);
  });

  it("polynomial: y = a*x^b", () => {
    expect(CurveImpl.polynomial(2, 3, 2)).toBe(16);
    expect(CurveImpl.polynomial(1, 0.5, 9)).toBe(3);
  });
});
