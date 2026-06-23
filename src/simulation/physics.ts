import { Vector } from "@/math/math";
import { Body } from "./body";

const SIMULATION_SPEED = 0.02;
const CENTER_PULL_SLOPE = 0.005;
const REPULSION_INNER = 65;
const REPULSION_OUTER = 270;
const REPULSION_OUTER_SQ = REPULSION_OUTER * REPULSION_OUTER;
const REPULSION_CLOSE_FORCE = -2;
const REPULSION_FAR_FORCE = -0.15;
const DAMPING = 0.92;
const SPRING_K = 0.005;
const SPRING_REST_LENGTH = 250;

export type EdgeIndex = { i: number; j: number };

export function update(nodes: Body[], edges: EdgeIndex[], deltaTime: number, center: Vector) {
  const timeFactor = SIMULATION_SPEED * deltaTime;

  // Apply forces toward center of screen
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.velocity.x += CENTER_PULL_SLOPE * (center.x - node.position.x);
    node.velocity.y += CENTER_PULL_SLOPE * (center.y - node.position.y);
  }

  // Apply force to move nodes away from each other
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      const dx = nodeB.position.x - nodeA.position.x;
      const dy = nodeB.position.y - nodeA.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq >= REPULSION_OUTER_SQ) continue;

      const distance = Math.sqrt(distSq);
      let factor: number;
      if (distance < REPULSION_INNER) factor = REPULSION_CLOSE_FORCE;
      else if (distance < REPULSION_OUTER) factor = REPULSION_FAR_FORCE;
      else continue;

      const mag = distance === 0 ? 1 : distance;
      const fx = (dx / mag) * factor;
      const fy = (dy / mag) * factor;
      nodeA.velocity.x += fx;
      nodeA.velocity.y += fy;
      nodeB.velocity.x -= fx;
      nodeB.velocity.y -= fy;
    }
  }

  // Apply spring attraction for edges
  for (const edge of edges) {
    const nodeA = nodes[edge.i];
    const nodeB = nodes[edge.j];
    const dx = nodeB.position.x - nodeA.position.x;
    const dy = nodeB.position.y - nodeA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) continue;
    const force = SPRING_K * (distance - SPRING_REST_LENGTH);
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;
    nodeA.velocity.x += fx;
    nodeA.velocity.y += fy;
    nodeB.velocity.x -= fx;
    nodeB.velocity.y -= fy;
  }

  // Dampen velocity and update positions
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.velocity.x *= DAMPING;
    node.velocity.y *= DAMPING;
    node.position.x += node.velocity.x * timeFactor;
    node.position.y += node.velocity.y * timeFactor;
    node.publisher.publish({ id: node.id, position: { x: node.position.x, y: node.position.y } });
  }
}
