import random from "random";
import { useEffect, useRef } from "react";
import { D3Graphics, EntityState } from "./lib/d3-graphics";
import { Graph } from "./lib/graph";
import { CurveImpl, Vector, VectorImpl } from "./lib/math";
import { Publisher } from "./lib/pubsub";
import { QuadTree, QuadTreeImpl } from "./lib/quad-tree";

interface GraphViewProps {
  graph: Graph;
}

type Node = {
  id: string;
  position: Vector;
  velocity: Vector;
  publisher: Publisher<EntityState>;
};

export function GraphView({ graph }: GraphViewProps) {
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const RADIUS = 6;
  const NODE_COUNT = 500;
  const nodes = useRef<Node[]>([]);
  const svgContainer = useRef<SVGSVGElement>(null);
  const d3Graphics = useRef<D3Graphics<Node> | null>(null);

  const cellCapacity = 4;
  const center: Vector = { x: WIDTH / 2, y: HEIGHT / 2 };
  const quadTree = useRef<QuadTree>(
    QuadTreeImpl.new({ center: center, halfSize: Math.max(WIDTH, HEIGHT) / 2 }, cellCapacity)
  );
  const nodeMap = useRef<Map<string, Node>>(new Map());

  useEffect(() => {
    console.log("View Graph: ", graph);

    if (!svgContainer.current) {
      return;
    }

    // Ensure D3Graphics is initialized only once
    if (!d3Graphics.current) {
      const generationRadius = 50;
      nodes.current = new Array(NODE_COUNT).fill(0).map((_, i) => ({
        id: `node-${i}`,
        position: {
          x: random.float(center.x - generationRadius, center.x + generationRadius),
          y: random.float(center.y - generationRadius, center.y + generationRadius),
        },
        velocity: VectorImpl.origin(),
        publisher: new Publisher<EntityState>(),
      }));

      nodes.current.forEach((node) => {
        quadTree.current = QuadTreeImpl.insert(quadTree.current, node);
        nodeMap.current.set(node.id, node);
      });

      d3Graphics.current = new D3Graphics(
        svgContainer.current,
        WIDTH,
        HEIGHT,
        RADIUS,
        nodes.current,
        onUpdate,
        onClickNode
      );
      d3Graphics.current.start();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onClickNode(node: Node) {
    console.log(`Clicked node: ${node.id}`);
  }

  function nodePublish(node: Node): void {
    node.publisher.publish({ id: node.id, position: { x: node.position.x, y: node.position.y } });
  }

  function onUpdate(_: number, deltaTime: number) {
    const simulationSpeed = 0.01;
    const timeFactor = simulationSpeed * deltaTime;

    // Apply forces toward center of screen
    for (let i = 0; i < nodes.current.length; i++) {
      const node = nodes.current[i];
      // TODO: Pull out slope and intercept parameters
      const curve = (x: number) => CurveImpl.linear(0.01, 0, x);
      const force = VectorImpl.map(VectorImpl.sub(center, node.position), curve);
      node.velocity = VectorImpl.add(node.velocity, force);
    }

    // Apply force to move nodes away from each other
    for (let i = 0; i < nodes.current.length; i++) {
      const nodeA = nodes.current[i];

      // TODO: Use a variable halfSize based on the range of node positions
      // const halfSize = 500;
      // const box: QuadBox = { center: nodeA.position, halfSize: halfSize };
      // const neighbors = QuadTreeImpl.query(quadTree.current, box);

      for (let j = i + 1; j < nodes.current.length; j++) {
        const nodeB = nodes.current[j];
        // for (let j = 0; j < neighbors.length; j++) {
        //   const item = neighbors[j];
        //   const nodeId = item.id;
        //   const nodeB = nodeMap.current.get(nodeId);
        //   if (!nodeB) {
        //     console.error(`Node not found: ${nodeId}`);
        //     continue;
        //   }
        //   if (nodeA.id === nodeB.id) {
        //     continue;
        //   }

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
    for (let i = 0; i < nodes.current.length; i++) {
      const node = nodes.current[i];
      const factor = 0.94;
      node.velocity = VectorImpl.mult(node.velocity, factor);
    }

    // Update node positions
    for (let i = 0; i < nodes.current.length; i++) {
      const node = nodes.current[i];
      node.position = VectorImpl.add(node.position, VectorImpl.mult(node.velocity, timeFactor));

      // Publish updated node states to all subscribers
      nodePublish(node);
    }
  }

  return (
    <div>
      <svg
        ref={svgContainer}
        className="h-[500px] w-[500px] border border-sea-green fill-light-green rounded-xl shadow-xl"
      />
    </div>
  );
}
