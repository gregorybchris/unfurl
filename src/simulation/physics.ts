import { CurveImpl, Vector, VectorImpl } from "@/math/math";
import { Body } from "./body";

export function update(nodes: Body[], deltaTime: number, center: Vector) {
  const simulationSpeed = 0.01;
  const timeFactor = simulationSpeed * deltaTime;

  // Apply forces toward center of screen
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // TODO: Pull out slope and intercept parameters
    const curve = (x: number) => CurveImpl.linear(0.01, 0, x);
    const force = VectorImpl.map(VectorImpl.sub(center, node.position), curve);
    node.velocity = VectorImpl.add(node.velocity, force);
  }

  // Apply force to move nodes away from each other
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];

    // TODO: Use a variable halfSize based on the range of node positions
    // const halfSize = 2000;
    // const box = { center: nodeA.position, halfSize: halfSize };
    // const neighbors = QuadTreeImpl.query(quadTree.current, box);

    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];

      // for (let j = 0; j < neighbors.length; j++) {
      //   const item = neighbors[j];
      //   const nodeId = item.id;
      //   const nodeB = nodeMap.current.get(nodeId);
      // if (!nodeB) {
      //   console.error(`Node not found: ${nodeId}`);
      //   continue;
      // }

      if (nodeA.id === nodeB.id) {
        continue;
      }

      const curve = (x: number) => {
        if (Math.abs(x) < 30) return -Math.sign(x) * 2;
        if (Math.abs(x) < 50) return -Math.sign(x) * -0.001;
        return 0;
      };
      const distance = VectorImpl.dist(nodeA.position, nodeB.position);
      const factor = curve(distance);
      const force = VectorImpl.mult(VectorImpl.unitTo(nodeA.position, nodeB.position), factor);

      nodeA.velocity = VectorImpl.add(nodeA.velocity, force);
      nodeB.velocity = VectorImpl.sub(nodeB.velocity, force);
    }
  }

  // Dampen velocity
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const factor = 0.94;
    node.velocity = VectorImpl.mult(node.velocity, factor);
  }

  // Update node positions
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.position = VectorImpl.add(node.position, VectorImpl.mult(node.velocity, timeFactor));

    // Publish updated node states to all subscribers
    node.publisher.publish({ id: node.id, position: { x: node.position.x, y: node.position.y } });
  }
}
