import { useEffect, useRef } from "react";
import { D3Graphics, EntityState } from "./lib/d3-graphics";
import { Graph } from "./lib/graph";
import { Publisher } from "./lib/pubsub";

interface GraphViewProps {
  graph: Graph;
}

type Node = {
  id: string;
  x: number;
  y: number;
  publisher: Publisher<EntityState>;
};

export function GraphView({ graph }: GraphViewProps) {
  const WIDTH = 300;
  const HEIGHT = 500;
  const svgContainer = useRef(null);

  console.log("View Graph: ", graph);

  const nodes: Node[] = new Array(10).fill(0).map((_, i) => ({
    id: `node-${i}`,
    x: 400,
    y: 200,
    publisher: new Publisher<EntityState>(),
  }));

  useEffect(() => {
    if (svgContainer.current) {
      const container = svgContainer.current;
      const d3Graphics = new D3Graphics(container, WIDTH, HEIGHT, nodes, onUpdate, onClickNode);
      d3Graphics.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onClickNode(node: Node) {
    console.log(`Clicked node: ${node.id}`);
  }

  function onUpdate(_: number, deltaTime: number) {
    const speed = 0.2;
    nodes.forEach((node: Node) => {
      node.x += (Math.random() - 0.5) * speed * deltaTime;
      node.y += (Math.random() - 0.5) * speed * deltaTime;

      const entityState: EntityState = { id: node.id, x: node.x, y: node.y };
      node.publisher.publish(entityState);
    });
  }

  return (
    <div>
      <svg ref={svgContainer} className="h-[300px] w-[500px] border border-sea-green" />
    </div>
  );
}
