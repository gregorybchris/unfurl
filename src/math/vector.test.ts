import { afterEach, describe, expect, it, vi } from 'vitest'
import { Vec2Impl } from './vec2'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Vec2Impl', () => {
  it('origin is the zero vector', () => {
    expect(Vec2Impl.origin()).toEqual({ x: 0, y: 0 })
  })

  it('add / sub / mult', () => {
    expect(Vec2Impl.add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 })
    expect(Vec2Impl.sub({ x: 3, y: 4 }, { x: 1, y: 2 })).toEqual({ x: 2, y: 2 })
    expect(Vec2Impl.mult({ x: 2, y: -3 }, 4)).toEqual({ x: 8, y: -12 })
  })

  it('mag computes magnitude', () => {
    expect(Vec2Impl.mag({ x: 3, y: 4 })).toBe(5)
    expect(Vec2Impl.mag({ x: 0, y: 0 })).toBe(0)
  })

  it('normalize yields a unit vector', () => {
    const n = Vec2Impl.normalize({ x: 3, y: 4 })
    expect(n.x).toBeCloseTo(0.6)
    expect(n.y).toBeCloseTo(0.8)
    expect(Vec2Impl.mag(n)).toBeCloseTo(1)
  })

  it('dist computes euclidean distance', () => {
    expect(Vec2Impl.dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(Vec2Impl.dist({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0)
  })

  it('mean averages vectors', () => {
    expect(
      Vec2Impl.mean([
        { x: 0, y: 0 },
        { x: 2, y: 4 },
      ])
    ).toEqual({ x: 1, y: 2 })
  })

  it('mean of empty array returns NaN vector and logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = Vec2Impl.mean([])
    expect(result.x).toBeNaN()
    expect(result.y).toBeNaN()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('toPolar converts to polar coordinates', () => {
    const p = Vec2Impl.toPolar({ x: 0, y: 2 })
    expect(p.r).toBeCloseTo(2)
    expect(p.a).toBeCloseTo(Math.PI / 2)
  })

  it('scale maps each component independently', () => {
    const result = Vec2Impl.scale(
      { x: 5, y: 5 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
      { x: { min: 0, max: 100 }, y: { min: 0, max: 1 } }
    )
    expect(result).toEqual({ x: 50, y: 0.5 })
  })

  it('clip clamps each component', () => {
    const result = Vec2Impl.clip(
      { x: -5, y: 50 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } }
    )
    expect(result).toEqual({ x: 0, y: 10 })
  })

  it('wrap wraps each component', () => {
    const result = Vec2Impl.wrap(
      { x: 11, y: -1 },
      { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } }
    )
    expect(result).toEqual({ x: 1, y: 9 })
  })

  it('inRange checks exclusive-min / inclusive-max bounds', () => {
    const range = { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } }
    expect(Vec2Impl.inRange({ x: 5, y: 5 }, range)).toBe(true)
    expect(Vec2Impl.inRange({ x: 10, y: 10 }, range)).toBe(true)
    expect(Vec2Impl.inRange({ x: 0, y: 5 }, range)).toBe(false)
    expect(Vec2Impl.inRange({ x: 11, y: 5 }, range)).toBe(false)
  })

  it('map applies a function to both components', () => {
    expect(Vec2Impl.map({ x: 2, y: 3 }, (n) => n * n)).toEqual({ x: 4, y: 9 })
  })

  it('unitTo returns a unit vector pointing from v1 to v2', () => {
    const u = Vec2Impl.unitTo({ x: 0, y: 0 }, { x: 0, y: 5 })
    expect(u).toEqual({ x: 0, y: 1 })
  })

  it('unitTo of identical points returns zero vector and logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(Vec2Impl.unitTo({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({ x: 0, y: 0 })
    expect(spy).toHaveBeenCalledOnce()
  })

  it('addPolar adds a polar offset to a vector', () => {
    const result = Vec2Impl.addPolar({ x: 1, y: 1 }, { r: 2, a: 0 })
    expect(result.x).toBeCloseTo(3)
    expect(result.y).toBeCloseTo(1)
  })

  it('rand stays within the vector range', () => {
    const range = { x: { min: 0, max: 1 }, y: { min: 10, max: 20 } }
    for (let i = 0; i < 50; i++) {
      const v = Vec2Impl.rand(range)
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(10)
      expect(v.y).toBeLessThanOrEqual(20)
    }
  })
})
