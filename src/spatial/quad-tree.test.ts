import { describe, expect, it, beforeEach } from 'vitest'
import { Item, QuadTreeImpl } from './quad-tree'

function item(id: string, x: number, y: number): Item {
  return { id, position: { x, y } }
}

let tree: QuadTreeImpl
const queryBuf: Item[] = []

function query(minX: number, maxX: number, minY: number, maxY: number): Item[] {
  queryBuf.length = 0
  tree.query(minX, maxX, minY, maxY, queryBuf)
  return [...queryBuf]
}

beforeEach(() => {
  tree = new QuadTreeImpl()
})

describe('QuadTreeImpl (mutable pool)', () => {
  describe('build + query basics', () => {
    it('returns nothing from an empty tree', () => {
      tree.build([], 0, 10, 0, 10)
      expect(query(-100, 100, -100, 100)).toEqual([])
    })

    it('finds a single item within its bounds', () => {
      tree.build([item('a', 3, 3)], 0, 10, 0, 10)
      expect(query(0, 10, 0, 10).map((i) => i.id)).toEqual(['a'])
    })

    it('excludes an item outside the query box', () => {
      tree.build([item('a', 1, 1), item('b', 9, 9)], 0, 10, 0, 10)
      expect(query(0, 5, 0, 5).map((i) => i.id)).toEqual(['a'])
    })

    it('returns nothing for a non-intersecting query box', () => {
      tree.build([item('a', 1, 1)], 0, 10, 0, 10)
      expect(query(100, 200, 100, 200)).toEqual([])
    })

    it('returns all items in a covering query', () => {
      const items = [item('a', 1, 1), item('b', 5, 5), item('c', 9, 9)]
      tree.build(items, 0, 10, 0, 10)
      const found = query(-100, 100, -100, 100)
        .map((i) => i.id)
        .sort()
      expect(found).toEqual(['a', 'b', 'c'])
    })
  })

  describe('subdivision (> CELL_CAPACITY items)', () => {
    it('handles more than 8 items without duplication', () => {
      const items = Array.from({ length: 20 }, (_, i) => item(`n${i}`, i * 0.5, i * 0.3))
      tree.build(items, 0, 10, 0, 6)
      const found = query(-100, 100, -100, 100)
        .map((i) => i.id)
        .sort()
      expect(found).toEqual(items.map((i) => i.id).sort())
    })

    it('each item appears at most once in a query result', () => {
      const items = Array.from({ length: 50 }, (_, i) =>
        item(`n${i}`, (i % 10) * 1.1, Math.floor(i / 10) * 1.1)
      )
      tree.build(items, 0, 11, 0, 11)
      const found = query(-100, 100, -100, 100)
      const ids = found.map((i) => i.id)
      expect(ids.length).toBe(new Set(ids).size) // no duplicates
      expect(ids.length).toBe(50)
    })
  })

  describe('pool reuse', () => {
    it('produces correct results after rebuilding the tree', () => {
      tree.build([item('a', 1, 1), item('b', 9, 9)], 0, 10, 0, 10)
      expect(query(0, 5, 0, 5).map((i) => i.id)).toEqual(['a'])

      // Rebuild with different data — pool nodes are reused.
      tree.build([item('c', 3, 3), item('d', 7, 7)], 0, 10, 0, 10)
      const found = query(0, 10, 0, 10)
        .map((i) => i.id)
        .sort()
      expect(found).toEqual(['c', 'd'])
    })
  })

  describe('3D bodies (position has x, y, z)', () => {
    it('finds 3D bodies using XY coordinates', () => {
      const body = { id: 'v', position: { x: 5, y: 5, z: 100 } }
      tree.build([body], 0, 10, 0, 10)
      expect(query(0, 10, 0, 10).map((i) => i.id)).toEqual(['v'])
    })
  })
})
