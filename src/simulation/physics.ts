import { AdjMatrix } from '@/graph/graph'
import { CurveImpl, INF } from '@/math/math'
import { Vec3 } from '@/math/vec3'
import { QuadTreeImpl } from '@/spatial/quad-tree'
import { Body } from './body'
import { FunctionType, PhysicsConfig } from './physics-config'

export type EdgeIndex = { i: number; j: number }

// Constants preserved for the "step" function type to keep exact prior behavior.
const REPULSION_INNER = 65
const REPULSION_OUTER = 270
const REPULSION_OUTER_SQ = REPULSION_OUTER * REPULSION_OUTER
const REPULSION_CLOSE_FORCE = -2
const REPULSION_FAR_FORCE = -0.15
const CENTER_PULL_SLOPE = 0.005
const SPRING_K = 0.05
const SPRING_REST_LENGTH = 100
const MAX_VELOCITY_SQ = 100 * 100

// Module-level singletons — no heap allocation after the first frame.
const _tree = new QuadTreeImpl()
const _queryBuf: Body[] = []
let _cachedNodes: Body[] | null = null
let _nodeIndexMap: Map<string, number> = new Map()

// Cache the id→index map keyed by the nodes array reference.
// In practice the same array is passed every frame, so this rebuilds at most once.
function getNodeIndexMap(nodes: Body[]): Map<string, number> {
  if (nodes !== _cachedNodes) {
    _cachedNodes = nodes
    _nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]))
  }
  return _nodeIndexMap
}

// Map Euclidean distance → repulsion magnitude (positive = push away).
function repulsionByDistance(fn: FunctionType, strength: number, distance: number): number {
  switch (fn) {
    case 'step':
      // Handled inline; this branch is unused.
      return 0
    case 'linear':
      return strength * Math.max(0, (REPULSION_OUTER - distance) / REPULSION_OUTER)
    case 'inverse':
      return distance > 0 ? strength / distance : strength
    case 'logistic':
      return strength * CurveImpl.logistic(1, -0.05, distance - 150)
    case 'logarithmic':
      return distance > 0
        ? strength * Math.max(0, 1 - Math.log(distance) / Math.log(REPULSION_OUTER))
        : strength
    case 'exponential':
      return strength * Math.exp(-distance / (REPULSION_OUTER * 0.3))
  }
}

// Map a 0..1 centrality score → drift multiplier.
function driftByCentrality(fn: FunctionType, strength: number, c: number): number {
  switch (fn) {
    case 'step':
    case 'linear':
      return CurveImpl.linear(strength, 0, c)
    case 'inverse':
      return c > 0 ? strength / (1 + c) : 0
    case 'logistic':
      return strength * CurveImpl.logistic(1, 6, c - 0.5)
    case 'logarithmic':
      return CurveImpl.logarithmic(strength, 0, 1 + c)
    case 'exponential':
      // Normalized so f(0)=0, f(1)=strength, with exponential acceleration.
      return (strength * (Math.exp(c) - 1)) / (Math.E - 1)
  }
}

export function update(
  nodes: Body[],
  edges: EdgeIndex[],
  deltaTime: number,
  center: Vec3,
  config: PhysicsConfig,
  graphDistances: AdjMatrix,
  nodeDegrees: number[],
  eigenvectorCentrality: number[]
): void {
  if (config.paused) return

  const timeFactor = config.simulationSpeed * deltaTime
  const nodeIndexMap = getNodeIndexMap(nodes)

  // --- Center Pull ---
  if (config.centerPull.enabled) {
    const s = config.centerPull.strength * CENTER_PULL_SLOPE
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.pinned) continue
      node.velocity.x += s * (center.x - node.position.x)
      node.velocity.y += s * (center.y - node.position.y)
      node.velocity.z += s * (center.z - node.position.z)
    }
  }

  // --- Basic Pair-wise Repulsion (quadtree-accelerated, XY plane) ---
  if (config.basicRepulsion.enabled && nodes.length > 0) {
    const fc = config.basicRepulsion

    // Compute tight XY bounds for the tree.
    let minX = nodes[0].position.x,
      maxX = minX
    let minY = nodes[0].position.y,
      maxY = minY
    for (let i = 1; i < nodes.length; i++) {
      const p = nodes[i].position
      if (p.x < minX) minX = p.x
      else if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      else if (p.y > maxY) maxY = p.y
    }
    _tree.build(nodes, minX, maxX, minY, maxY)

    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i]
      _queryBuf.length = 0
      _tree.query(
        nodeA.position.x - REPULSION_OUTER,
        nodeA.position.x + REPULSION_OUTER,
        nodeA.position.y - REPULSION_OUTER,
        nodeA.position.y + REPULSION_OUTER,
        _queryBuf
      )

      for (let k = 0; k < _queryBuf.length; k++) {
        const neighbor = _queryBuf[k] as Body
        const j = nodeIndexMap.get(neighbor.id)!
        if (j <= i) continue // each pair exactly once

        const nodeB = nodes[j]
        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const dz = nodeB.position.z - nodeA.position.z
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= REPULSION_OUTER_SQ) continue

        const distance = Math.sqrt(distSq)
        const mag = distance === 0 ? 1 : distance

        let factor: number
        if (fc.functionType === 'step') {
          factor =
            distance < REPULSION_INNER
              ? REPULSION_CLOSE_FORCE * fc.strength
              : REPULSION_FAR_FORCE * fc.strength
        } else {
          factor = -repulsionByDistance(fc.functionType, fc.strength, distance)
        }

        const fx = (dx / mag) * factor
        const fy = (dy / mag) * factor
        const fz = (dz / mag) * factor
        if (!nodeA.pinned) {
          nodeA.velocity.x += fx
          nodeA.velocity.y += fy
          nodeA.velocity.z += fz
        }
        if (!nodeB.pinned) {
          nodeB.velocity.x -= fx
          nodeB.velocity.y -= fy
          nodeB.velocity.z -= fz
        }
      }
    }
  }

  // --- Spring Attraction ---
  if (config.springAttraction.enabled) {
    const k = SPRING_K * config.springAttraction.strength
    for (const edge of edges) {
      const nodeA = nodes[edge.i]
      const nodeB = nodes[edge.j]
      const dx = nodeB.position.x - nodeA.position.x
      const dy = nodeB.position.y - nodeA.position.y
      const dz = nodeB.position.z - nodeA.position.z
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq === 0) continue
      const distance = Math.sqrt(distSq)
      const force = k * (distance - SPRING_REST_LENGTH)
      const fx = (dx / distance) * force
      const fy = (dy / distance) * force
      const fz = (dz / distance) * force
      if (!nodeA.pinned) {
        nodeA.velocity.x += fx
        nodeA.velocity.y += fy
        nodeA.velocity.z += fz
      }
      if (!nodeB.pinned) {
        nodeB.velocity.x -= fx
        nodeB.velocity.y -= fy
        nodeB.velocity.z -= fz
      }
    }
  }

  // --- Graph Distance Repulsion ---
  if (config.graphDistanceRepulsion.enabled && graphDistances.length > 0) {
    const fc = config.graphDistanceRepulsion
    const fn = fc.functionType === 'step' ? 'linear' : fc.functionType
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const graphDist = graphDistances[i]?.[j]
        // Skip adjacent nodes (let spring handle them) and disconnected pairs.
        if (graphDist === undefined || graphDist === INF || graphDist <= 1) continue

        const nodeA = nodes[i]
        const nodeB = nodes[j]
        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const dz = nodeB.position.z - nodeA.position.z
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq === 0) continue

        // Ideal separation grows with hop count: 2-hop → 1 rest-length, N-hop → (N-1) rest-lengths.
        const targetDist = (graphDist - 1) * SPRING_REST_LENGTH
        const euclidean = Math.sqrt(distSq)
        if (euclidean >= targetDist) continue

        // Remap euclidean position within [0, targetDist] into repulsionByDistance's range,
        // so the selected curve applies within the repulsion zone.
        const scaledDist = (euclidean / targetDist) * REPULSION_OUTER
        const repulse = repulsionByDistance(fn, fc.strength, scaledDist)
        const fx = -(dx / euclidean) * repulse
        const fy = -(dy / euclidean) * repulse
        const fz = -(dz / euclidean) * repulse
        if (!nodeA.pinned) {
          nodeA.velocity.x += fx
          nodeA.velocity.y += fy
          nodeA.velocity.z += fz
        }
        if (!nodeB.pinned) {
          nodeB.velocity.x -= fx
          nodeB.velocity.y -= fy
          nodeB.velocity.z -= fz
        }
      }
    }
  }

  // --- Degree Centrality Drift ---
  if (config.degreeDrift.enabled && nodeDegrees.length > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.pinned) continue
      const pull =
        driftByCentrality(
          config.degreeDrift.functionType,
          config.degreeDrift.strength,
          nodeDegrees[i] ?? 0
        ) * CENTER_PULL_SLOPE
      node.velocity.x += pull * (center.x - node.position.x)
      node.velocity.y += pull * (center.y - node.position.y)
      node.velocity.z += pull * (center.z - node.position.z)
    }
  }

  // --- Degree Centrality Repulsion ---
  if (config.degreeRepulsion.enabled && nodeDegrees.length > 0) {
    const fc = config.degreeRepulsion
    const fn = fc.functionType === 'step' ? 'linear' : fc.functionType
    let maxDegree = 1
    for (let k = 0; k < nodeDegrees.length; k++) {
      if (nodeDegrees[k] > maxDegree) maxDegree = nodeDegrees[k]
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const dz = nodeB.position.z - nodeA.position.z
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= REPULSION_OUTER_SQ) continue

        const distance = Math.sqrt(distSq)
        const mag = distance === 0 ? 1 : distance
        const degreeScale = ((nodeDegrees[i] ?? 0) + (nodeDegrees[j] ?? 0)) / (2 * maxDegree)
        const factor = -repulsionByDistance(fn, fc.strength * degreeScale, distance)

        const fx = (dx / mag) * factor
        const fy = (dy / mag) * factor
        const fz = (dz / mag) * factor
        if (!nodeA.pinned) {
          nodeA.velocity.x += fx
          nodeA.velocity.y += fy
          nodeA.velocity.z += fz
        }
        if (!nodeB.pinned) {
          nodeB.velocity.x -= fx
          nodeB.velocity.y -= fy
          nodeB.velocity.z -= fz
        }
      }
    }
  }

  // --- Eigenvector Centrality Drift ---
  if (config.eigenvectorDrift.enabled && eigenvectorCentrality.length > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.pinned) continue
      const pull =
        driftByCentrality(
          config.eigenvectorDrift.functionType,
          config.eigenvectorDrift.strength,
          eigenvectorCentrality[i] ?? 0
        ) * CENTER_PULL_SLOPE
      node.velocity.x += pull * (center.x - node.position.x)
      node.velocity.y += pull * (center.y - node.position.y)
      node.velocity.z += pull * (center.z - node.position.z)
    }
  }

  // --- Clamp velocity to prevent runaway nodes ---
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.pinned) continue
    const vSq =
      node.velocity.x * node.velocity.x +
      node.velocity.y * node.velocity.y +
      node.velocity.z * node.velocity.z
    if (vSq > MAX_VELOCITY_SQ) {
      const scale = 100 / Math.sqrt(vSq)
      node.velocity.x *= scale
      node.velocity.y *= scale
      node.velocity.z *= scale
    }
  }

  // --- Dampen velocity and update positions ---
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.pinned) {
      node.velocity.x = 0
      node.velocity.y = 0
      node.velocity.z = 0
      continue
    }
    node.velocity.x *= 0.92
    node.velocity.y *= 0.92
    node.velocity.z *= 0.92
    node.position.x += node.velocity.x * timeFactor
    node.position.y += node.velocity.y * timeFactor
    node.position.z += node.velocity.z * timeFactor
  }
}

export function addHeat(nodes: Body[], magnitude = 50): void {
  for (const node of nodes) {
    if (node.pinned) continue
    node.velocity.x += (Math.random() - 0.5) * magnitude
    node.velocity.y += (Math.random() - 0.5) * magnitude
    node.velocity.z += (Math.random() - 0.5) * magnitude
  }
}
