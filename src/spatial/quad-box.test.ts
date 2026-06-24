import { describe, expect, it } from 'vitest'
import { QuadBox, QuadBoxImpl } from './quad-box'

const box: QuadBox = { center: { x: 0, y: 0 }, halfSize: 5 }

describe('QuadBoxImpl', () => {
  describe('toVectorRange', () => {
    it('derives min/max bounds from the center and half-size', () => {
      expect(QuadBoxImpl.toVectorRange(box)).toEqual({
        x: { min: -5, max: 5 },
        y: { min: -5, max: 5 },
      })
    })
  })

  describe('boxContains', () => {
    it('includes points inside and on the max edge, excludes the min edge', () => {
      expect(QuadBoxImpl.boxContains(box, { x: 0, y: 0 })).toBe(true)
      expect(QuadBoxImpl.boxContains(box, { x: 5, y: 5 })).toBe(true) // max inclusive
      expect(QuadBoxImpl.boxContains(box, { x: -5, y: 0 })).toBe(false) // min exclusive
      expect(QuadBoxImpl.boxContains(box, { x: 6, y: 0 })).toBe(false)
    })
  })

  describe('boxIntersects', () => {
    it('is true when boxes overlap', () => {
      const other: QuadBox = { center: { x: 9, y: 0 }, halfSize: 5 }
      expect(QuadBoxImpl.boxIntersects(box, other)).toBe(true)
    })

    it('is false when boxes are exactly touching or apart', () => {
      const touching: QuadBox = { center: { x: 10, y: 0 }, halfSize: 5 }
      const apart: QuadBox = { center: { x: 100, y: 100 }, halfSize: 5 }
      expect(QuadBoxImpl.boxIntersects(box, touching)).toBe(false)
      expect(QuadBoxImpl.boxIntersects(box, apart)).toBe(false)
    })
  })

  describe('fromVec2Range', () => {
    it('builds a square box that covers the larger dimension', () => {
      const result = QuadBoxImpl.fromVec2Range({
        x: { min: 0, max: 10 },
        y: { min: 0, max: 4 },
      })
      expect(result).toEqual({ center: { x: 5, y: 5 }, halfSize: 5 })
    })
  })

  describe('fromRadius', () => {
    it('builds a box centered on the vector with the radius as half-size', () => {
      expect(QuadBoxImpl.fromRadius({ x: 1, y: 2 }, 3)).toEqual({
        center: { x: 1, y: 2 },
        halfSize: 3,
      })
    })
  })
})
