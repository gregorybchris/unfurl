import random from "random";
import { useEffect, useRef } from "react";
import { D3Graphics, EntityState } from "./lib/d3-graphics";
import { Graph } from "./lib/graph";
import { Vector, VectorImpl } from "./lib/math";
import { Node } from "./lib/node";
import { update } from "./lib/physics";
import { Publisher } from "./lib/pubsub";
import { QuadTree, QuadTreeImpl } from "./lib/quad-tree";

interface GraphViewProps {
  graph: Graph;
}

export function GraphView({ graph }: GraphViewProps) {
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const RADIUS = 6;
  const NUM_NODES = 500;

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
      nodes.current = new Array(NUM_NODES).fill(0).map((_, i) => ({
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

  function onUpdate(_: number, deltaTime: number) {
    update(nodes.current, deltaTime, center);
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
