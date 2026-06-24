import { describe, expect, it } from 'vitest'
import { INF } from './math'
import { CurveImpl } from './curves'

describe('INF', () => {
  it('equals Number.MAX_SAFE_INTEGER', () => {
    expect(INF).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('CurveImpl', () => {
  it('linear: y = m*x + b', () => {
    expect(CurveImpl.linear(2, 1, 3)).toBe(7)
    expect(CurveImpl.linear(0, 5, 100)).toBe(5)
  })

  it('exponential: y = a*b^x', () => {
    expect(CurveImpl.exponential(2, 3, 2)).toBe(18)
    expect(CurveImpl.exponential(1, 2, 0)).toBe(1)
  })

  it('logistic: y = a / (1 + e^(-b*x))', () => {
    expect(CurveImpl.logistic(1, 1, 0)).toBeCloseTo(0.5)
    expect(CurveImpl.logistic(10, 1, 0)).toBeCloseTo(5)
  })

  it('logarithmic: y = a*ln(x) + b', () => {
    expect(CurveImpl.logarithmic(1, 0, 1)).toBeCloseTo(0)
    expect(CurveImpl.logarithmic(2, 1, Math.E)).toBeCloseTo(3)
  })

  it('polynomial: y = a*x^b', () => {
    expect(CurveImpl.polynomial(2, 3, 2)).toBe(16)
    expect(CurveImpl.polynomial(1, 0.5, 9)).toBe(3)
  })
})
