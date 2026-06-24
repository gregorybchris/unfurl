export interface Item {
  id: string
  position: { x: number; y: number }
}

const CELL_CAPACITY = 8

class PooledNode {
  minX = 0
  maxX = 0
  minY = 0
  maxY = 0
  readonly items: Array<Item | null>
  count = 0
  nw: PooledNode | null = null
  ne: PooledNode | null = null
  sw: PooledNode | null = null
  se: PooledNode | null = null

  constructor() {
    this.items = new Array<Item | null>(CELL_CAPACITY).fill(null)
  }

  reset(minX: number, maxX: number, minY: number, maxY: number): void {
    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
    this.count = 0
    this.nw = this.ne = this.sw = this.se = null
  }
}

// Mutable, pool-backed quad-tree. Rebuild each frame via build(); the pool
// is reused across calls so steady-state operation allocates nothing on the heap.
export class QuadTreeImpl {
  private pool: PooledNode[] = []
  private poolIdx = 0
  private root: PooledNode | null = null

  private alloc(minX: number, maxX: number, minY: number, maxY: number): PooledNode {
    let node: PooledNode
    if (this.poolIdx < this.pool.length) {
      node = this.pool[this.poolIdx]
    } else {
      node = new PooledNode()
      this.pool.push(node)
    }
    this.poolIdx++
    node.reset(minX, maxX, minY, maxY)
    return node
  }

  // Build the tree from items. minX/maxX/minY/maxY must tightly enclose all positions.
  build(items: readonly Item[], minX: number, maxX: number, minY: number, maxY: number): void {
    this.poolIdx = 0
    const pad = 1 + (maxX - minX + maxY - minY) * 0.001
    this.root = this.alloc(minX - pad, maxX + pad, minY - pad, maxY + pad)
    for (const item of items) {
      this._insert(this.root, item)
    }
  }

  private _insert(node: PooledNode, item: Item): void {
    if (node.nw === null) {
      if (node.count < CELL_CAPACITY) {
        node.items[node.count++] = item
        return
      }
      // Leaf is full — subdivide and redistribute existing items.
      const midX = (node.minX + node.maxX) * 0.5
      const midY = (node.minY + node.maxY) * 0.5
      node.nw = this.alloc(node.minX, midX, midY, node.maxY)
      node.ne = this.alloc(midX, node.maxX, midY, node.maxY)
      node.sw = this.alloc(node.minX, midX, node.minY, midY)
      node.se = this.alloc(midX, node.maxX, node.minY, midY)
      for (let i = 0; i < node.count; i++) {
        this._insertIntoChild(node, node.items[i]!)
      }
      node.count = 0
    }
    this._insertIntoChild(node, item)
  }

  private _insertIntoChild(node: PooledNode, item: Item): void {
    const midX = (node.minX + node.maxX) * 0.5
    const midY = (node.minY + node.maxY) * 0.5
    // Each item goes into exactly one child quadrant.
    const child =
      item.position.x <= midX
        ? item.position.y >= midY
          ? node.nw!
          : node.sw!
        : item.position.y >= midY
          ? node.ne!
          : node.se!
    this._insert(child, item)
  }

  // Append all items within [minX,maxX]×[minY,maxY] into `out`.
  // Caller must clear `out` before each call.
  query(minX: number, maxX: number, minY: number, maxY: number, out: Item[]): void {
    if (this.root !== null) this._query(this.root, minX, maxX, minY, maxY, out)
  }

  private _query(
    node: PooledNode,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    out: Item[]
  ): void {
    if (maxX < node.minX || minX > node.maxX || maxY < node.minY || minY > node.maxY) return
    for (let i = 0; i < node.count; i++) {
      const item = node.items[i]!
      const x = item.position.x,
        y = item.position.y
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) out.push(item)
    }
    if (node.nw !== null) {
      this._query(node.nw, minX, maxX, minY, maxY, out)
      this._query(node.ne!, minX, maxX, minY, maxY, out)
      this._query(node.sw!, minX, maxX, minY, maxY, out)
      this._query(node.se!, minX, maxX, minY, maxY, out)
    }
  }
}
