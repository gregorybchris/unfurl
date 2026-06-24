import { afterEach, describe, expect, it, vi } from 'vitest'
import { StatsImpl } from './stats'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StatsImpl', () => {
  describe('mean', () => {
    it('averages a list of numbers', () => {
      expect(StatsImpl.mean([1, 2, 3, 4])).toBe(2.5)
      expect(StatsImpl.mean([5])).toBe(5)
      expect(StatsImpl.mean([-2, 2])).toBe(0)
    })

    it('returns NaN and logs for an empty array', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(StatsImpl.mean([])).toBeNaN()
      expect(spy).toHaveBeenCalledOnce()
    })
  })

  describe('scale', () => {
    it('maps a value from one range to another', () => {
      expect(StatsImpl.scale(5, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(50)
      expect(StatsImpl.scale(0, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(0)
      expect(StatsImpl.scale(10, { min: 0, max: 10 }, { min: -1, max: 1 })).toBe(1)
    })

    it('returns NaN and logs for a zero-width source range', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(StatsImpl.scale(5, { min: 4, max: 4 }, { min: 0, max: 1 })).toBeNaN()
      expect(spy).toHaveBeenCalledOnce()
    })
  })

  describe('rand', () => {
    it('stays within the requested range', () => {
      for (let i = 0; i < 100; i++) {
        const value = StatsImpl.rand({ min: 2, max: 5 })
        expect(value).toBeGreaterThanOrEqual(2)
        expect(value).toBeLessThanOrEqual(5)
      }
    })
  })

  describe('clip', () => {
    it('clamps to the range bounds', () => {
      const range = { min: 0, max: 10 }
      expect(StatsImpl.clip(-5, range)).toBe(0)
      expect(StatsImpl.clip(15, range)).toBe(10)
      expect(StatsImpl.clip(5, range)).toBe(5)
    })
  })

  describe('mod', () => {
    it('returns a non-negative remainder', () => {
      expect(StatsImpl.mod(7, 3)).toBe(1)
      expect(StatsImpl.mod(-1, 3)).toBe(2)
      expect(StatsImpl.mod(-4, 3)).toBe(2)
      expect(StatsImpl.mod(6, 3)).toBe(0)
    })
  })

  describe('wrap', () => {
    it('wraps values into the range', () => {
      const range = { min: 0, max: 10 }
      expect(StatsImpl.wrap(11, range)).toBe(1)
      expect(StatsImpl.wrap(-1, range)).toBe(9)
      expect(StatsImpl.wrap(5, range)).toBe(5)
    })

    it('respects a non-zero minimum', () => {
      const range = { min: 5, max: 15 }
      expect(StatsImpl.wrap(16, range)).toBe(6)
      expect(StatsImpl.wrap(4, range)).toBe(14)
    })
  })
})
