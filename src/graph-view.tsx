import { useEffect, useRef } from "react";
import { D3Graphics, EntityState } from "./lib/d3-graphics";
import { Graph } from "./lib/graph";
import { Vector } from "./lib/math";
import { Publisher } from "./lib/pubsub";

interface GraphViewProps {
  graph: Graph;
}

type Node = {
  id: string;
  position: Vector;
  publisher: Publisher<EntityState>;
};

export function GraphView({ graph }: GraphViewProps) {
  const WIDTH = 300;
  const HEIGHT = 500;
  const nodes = useRef<Node[]>([]);
  const svgContainer = useRef<SVGSVGElement>(null);
  const d3Graphics = useRef<D3Graphics | null>(null);

  useEffect(() => {
    console.log("View Graph: ", graph);

    if (!svgContainer.current) {
      return;
    }

    // Ensure D3Graphics is initialized only once
    if (!d3Graphics.current) {
      nodes.current = new Array(10).fill(0).map((_, i) => ({
        id: `node-${i}`,
        position: { x: 400, y: 200 },
        publisher: new Publisher<EntityState>(),
      }));

      d3Graphics.current = new D3Graphics(svgContainer.current, WIDTH, HEIGHT, nodes.current, onUpdate, onClickNode);
      d3Graphics.current.start();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onClickNode(node: Node) {
    console.log(`Clicked node: ${node.id}`);
  }

  function onUpdate(_: number, deltaTime: number) {
    const speed = 0.5;

    for (let i = 0; i < nodes.current.length; i++) {
      const nodeA = nodes.current[i];

      // for (let j = 0; j < nodes.current.length; j++) {
      //   const nodeB = nodes.current[j];
      // }

      nodeA.position.x += (Math.random() - 0.5) * speed * deltaTime;
      nodeA.position.y += (Math.random() - 0.5) * speed * deltaTime;

      const entityState: EntityState = { id: nodeA.id, position: { x: nodeA.position.x, y: nodeA.position.y } };
      nodeA.publisher.publish(entityState);
    }
  }

  return (
    <div>
      <svg ref={svgContainer} className="h-[300px] w-[500px] border border-sea-green" />
    </div>
  );
}
