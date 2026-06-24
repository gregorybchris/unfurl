import { afterEach, describe, expect, it, vi } from 'vitest'
import { PolarImpl } from './polar'
import { VectorImpl } from './vector'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PolarImpl', () => {
  it('origin is zero', () => {
    expect(PolarImpl.origin()).toEqual({ r: 0, a: 0 })
  })

  it('toRect converts to cartesian coordinates', () => {
    const v = PolarImpl.toRect({ r: 2, a: 0 })
    expect(v.x).toBeCloseTo(2)
    expect(v.y).toBeCloseTo(0)

    const v2 = PolarImpl.toRect({ r: 1, a: Math.PI / 2 })
    expect(v2.x).toBeCloseTo(0)
    expect(v2.y).toBeCloseTo(1)
  })

  it('toRect/toPolar round-trip', () => {
    const original = { r: 3, a: 1 }
    const back = VectorImpl.toPolar(PolarImpl.toRect(original))
    expect(back.r).toBeCloseTo(original.r)
    expect(back.a).toBeCloseTo(original.a)
  })

  it('mult scales the radius but keeps the angle', () => {
    expect(PolarImpl.mult({ r: 2, a: 1 }, 3)).toEqual({ r: 6, a: 1 })
  })

  it('clip clamps the radius', () => {
    expect(PolarImpl.clip({ r: 50, a: 1 }, { min: 0, max: 10 })).toEqual({ r: 10, a: 1 })
  })

  it('add sums two polar vectors', () => {
    const sum = PolarImpl.add({ r: 2, a: 0 }, { r: 3, a: 0 })
    expect(sum.r).toBeCloseTo(5)
    expect(sum.a).toBeCloseTo(0)
  })

  it('mean of empty array returns NaN polar and logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = PolarImpl.mean([])
    expect(result.r).toBeNaN()
    expect(result.a).toBeNaN()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('rand stays within the polar range', () => {
    const range = { r: { min: 1, max: 2 }, a: { min: 0, max: Math.PI } }
    for (let i = 0; i < 50; i++) {
      const p = PolarImpl.rand(range)
      expect(p.r).toBeGreaterThanOrEqual(1)
      expect(p.r).toBeLessThanOrEqual(2)
      expect(p.a).toBeGreaterThanOrEqual(0)
      expect(p.a).toBeLessThanOrEqual(Math.PI)
    }
  })

  it('randFromRange uses a full angular sweep', () => {
    for (let i = 0; i < 50; i++) {
      const p = PolarImpl.randFromRange({ min: 0, max: 5 })
      expect(p.r).toBeGreaterThanOrEqual(0)
      expect(p.r).toBeLessThanOrEqual(5)
      expect(p.a).toBeGreaterThanOrEqual(0)
      expect(p.a).toBeLessThanOrEqual(2 * Math.PI)
    }
  })
})
