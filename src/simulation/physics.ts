import { AdjMatrix } from "@/graph/graph";
import { CurveImpl, INF, Vector } from "@/math/math";
import { QuadBoxImpl } from "@/spatial/quad-box";
import { QuadTreeImpl } from "@/spatial/quad-tree";
import { Body } from "./body";
import { FunctionType, PhysicsConfig } from "./physics-config";

export type EdgeIndex = { i: number; j: number };

// Constants preserved for the "step" function type to keep exact prior behavior.
const REPULSION_INNER = 65;
const REPULSION_OUTER = 270;
const REPULSION_OUTER_SQ = REPULSION_OUTER * REPULSION_OUTER;
const REPULSION_CLOSE_FORCE = -2;
const REPULSION_FAR_FORCE = -0.15;
const CENTER_PULL_SLOPE = 0.005;
const SPRING_K = 0.015;
const SPRING_REST_LENGTH = 100;

// Map Euclidean distance → repulsion magnitude (positive = push away).
function repulsionByDistance(fn: FunctionType, strength: number, distance: number): number {
  switch (fn) {
    case "step":
      // Handled inline; this branch is unused.
      return 0;
    case "linear":
      return strength * Math.max(0, (REPULSION_OUTER - distance) / REPULSION_OUTER);
    case "inverse":
      return distance > 0 ? strength / distance : strength;
    case "logistic":
      return strength * CurveImpl.logistic(1, -0.05, distance - 150);
    case "logarithmic":
      return distance > 0 ? strength * Math.max(0, 1 - Math.log(distance) / Math.log(REPULSION_OUTER)) : strength;
    case "exponential":
      return strength * Math.exp(-distance / (REPULSION_OUTER * 0.3));
  }
}

// Map a 0..1 centrality score → drift multiplier.
function driftByCentrality(fn: FunctionType, strength: number, c: number): number {
  switch (fn) {
    case "step":
    case "linear":
      return CurveImpl.linear(strength, 0, c);
    case "inverse":
      return c > 0 ? strength / (1 + c) : 0;
    case "logistic":
      return strength * CurveImpl.logistic(1, 6, c - 0.5);
    case "logarithmic":
      return CurveImpl.logarithmic(strength, 0, 1 + c);
    case "exponential":
      // Normalized so f(0)=0, f(1)=strength, with exponential acceleration.
      return strength * (Math.exp(c) - 1) / (Math.E - 1);
  }
}

export function update(
  nodes: Body[],
  edges: EdgeIndex[],
  deltaTime: number,
  center: Vector,
  config: PhysicsConfig,
  graphDistances: AdjMatrix,
  nodeDegrees: number[],
  eigenvectorCentrality: number[],
): void {
  if (config.paused) return;

  const timeFactor = config.simulationSpeed * deltaTime;

  // Build id → index map (used for quadtree pair dedup).
  const nodeIndexMap = new Map<string, number>(nodes.map((n, i) => [n.id, i]));

  // --- Center Pull ---
  if (config.centerPull.enabled) {
    const s = config.centerPull.strength * CENTER_PULL_SLOPE;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.pinned) continue;
      node.velocity.x += s * (center.x - node.position.x);
      node.velocity.y += s * (center.y - node.position.y);
    }
  }

  // --- Basic Pair-wise Repulsion (quadtree-accelerated) ---
  if (config.basicRepulsion.enabled && nodes.length > 0) {
    const fc = config.basicRepulsion;

    // Build a bounding quadtree from current node positions.
    let minX = nodes[0].position.x, maxX = minX;
    let minY = nodes[0].position.y, maxY = minY;
    for (const n of nodes) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.x > maxX) maxX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.y > maxY) maxY = n.position.y;
    }
    const halfSize = Math.max(maxX - minX, maxY - minY) / 2 + 500;
    const treeCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    let tree = QuadTreeImpl.new({ center: treeCenter, halfSize }, 4);
    for (const node of nodes) {
      tree = QuadTreeImpl.insert(tree, node);
    }

    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const queryBox = QuadBoxImpl.fromRadius(nodeA.position, REPULSION_OUTER);
      const neighbors = QuadTreeImpl.query(tree, queryBox);

      for (const neighbor of neighbors) {
        const j = nodeIndexMap.get(neighbor.id)!;
        if (j <= i) continue; // each pair exactly once

        const nodeB = nodes[j];
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= REPULSION_OUTER_SQ) continue;

        const distance = Math.sqrt(distSq);
        const mag = distance === 0 ? 1 : distance;

        let factor: number;
        if (fc.functionType === "step") {
          factor = distance < REPULSION_INNER
            ? REPULSION_CLOSE_FORCE * fc.strength
            : REPULSION_FAR_FORCE * fc.strength;
        } else {
          factor = -repulsionByDistance(fc.functionType, fc.strength, distance);
        }

        const fx = (dx / mag) * factor;
        const fy = (dy / mag) * factor;
        if (!nodeA.pinned) { nodeA.velocity.x += fx; nodeA.velocity.y += fy; }
        if (!nodeB.pinned) { nodeB.velocity.x -= fx; nodeB.velocity.y -= fy; }
      }
    }
  }

  // --- Spring Attraction ---
  if (config.springAttraction.enabled) {
    const k = SPRING_K * config.springAttraction.strength;
    for (const edge of edges) {
      const nodeA = nodes[edge.i];
      const nodeB = nodes[edge.j];
      const dx = nodeB.position.x - nodeA.position.x;
      const dy = nodeB.position.y - nodeA.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) continue;
      const force = k * (distance - SPRING_REST_LENGTH);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      if (!nodeA.pinned) { nodeA.velocity.x += fx; nodeA.velocity.y += fy; }
      if (!nodeB.pinned) { nodeB.velocity.x -= fx; nodeB.velocity.y -= fy; }
    }
  }

  // --- Graph Distance Repulsion ---
  if (config.graphDistanceRepulsion.enabled && graphDistances.length > 0) {
    const fc = config.graphDistanceRepulsion;
    const fn = fc.functionType === "step" ? "linear" : fc.functionType;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const graphDist = graphDistances[i]?.[j];
        if (graphDist === undefined || graphDist === INF || graphDist === 0) continue;

        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const euclidean = Math.sqrt(dx * dx + dy * dy);
        if (euclidean === 0) continue;

        // Scale strength by graph distance (farther apart in graph → more repulsion).
        const repulse = repulsionByDistance(fn, fc.strength * graphDist * 0.3, euclidean);
        const fx = -(dx / euclidean) * repulse;
        const fy = -(dy / euclidean) * repulse;
        if (!nodeA.pinned) { nodeA.velocity.x += fx; nodeA.velocity.y += fy; }
        if (!nodeB.pinned) { nodeB.velocity.x -= fx; nodeB.velocity.y -= fy; }
      }
    }
  }

  // --- Degree Centrality Drift ---
  if (config.degreeDrift.enabled && nodeDegrees.length > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.pinned) continue;
      const pull = driftByCentrality(config.degreeDrift.functionType, config.degreeDrift.strength, nodeDegrees[i] ?? 0) * CENTER_PULL_SLOPE;
      node.velocity.x += pull * (center.x - node.position.x);
      node.velocity.y += pull * (center.y - node.position.y);
    }
  }

  // --- Degree Centrality Repulsion ---
  if (config.degreeRepulsion.enabled && nodeDegrees.length > 0) {
    const fc = config.degreeRepulsion;
    const fn = fc.functionType === "step" ? "linear" : fc.functionType;
    const maxDegree = Math.max(1, ...nodeDegrees);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= REPULSION_OUTER_SQ) continue;

        const distance = Math.sqrt(distSq);
        const mag = distance === 0 ? 1 : distance;
        const degreeScale = ((nodeDegrees[i] ?? 0) + (nodeDegrees[j] ?? 0)) / (2 * maxDegree);
        const factor = -repulsionByDistance(fn, fc.strength * degreeScale, distance);

        const fx = (dx / mag) * factor;
        const fy = (dy / mag) * factor;
        if (!nodeA.pinned) { nodeA.velocity.x += fx; nodeA.velocity.y += fy; }
        if (!nodeB.pinned) { nodeB.velocity.x -= fx; nodeB.velocity.y -= fy; }
      }
    }
  }

  // --- Eigenvector Centrality Drift ---
  if (config.eigenvectorDrift.enabled && eigenvectorCentrality.length > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.pinned) continue;
      const pull = driftByCentrality(config.eigenvectorDrift.functionType, config.eigenvectorDrift.strength, eigenvectorCentrality[i] ?? 0) * CENTER_PULL_SLOPE;
      node.velocity.x += pull * (center.x - node.position.x);
      node.velocity.y += pull * (center.y - node.position.y);
    }
  }

  // --- Clamp velocity to prevent runaway nodes ---
  const MAX_VELOCITY_SQ = 100 * 100;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.pinned) continue;
    const vSq = node.velocity.x * node.velocity.x + node.velocity.y * node.velocity.y;
    if (vSq > MAX_VELOCITY_SQ) {
      const scale = 100 / Math.sqrt(vSq);
      node.velocity.x *= scale;
      node.velocity.y *= scale;
    }
  }

  // --- Dampen velocity and update positions ---
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.pinned) {
      node.velocity.x = 0;
      node.velocity.y = 0;
      node.publisher.publish({ id: node.id, position: { x: node.position.x, y: node.position.y } });
      continue;
    }
    node.velocity.x *= config.damping;
    node.velocity.y *= config.damping;
    node.position.x += node.velocity.x * timeFactor;
    node.position.y += node.velocity.y * timeFactor;
    node.publisher.publish({ id: node.id, position: { x: node.position.x, y: node.position.y } });
  }
}

export function addHeat(nodes: Body[], magnitude = 50): void {
  for (const node of nodes) {
    if (node.pinned) continue;
    node.velocity.x += (Math.random() - 0.5) * magnitude;
    node.velocity.y += (Math.random() - 0.5) * magnitude;
  }
}
