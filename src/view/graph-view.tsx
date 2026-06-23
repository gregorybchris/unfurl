import random, { Random } from "random";
import { useEffect, useRef } from "react";
import { Publisher } from "@/events/pubsub";
import { JsonGraph } from "@/graph/graph";
import { Vector, VectorImpl } from "@/math/math";
import { D3Graphics, EdgeRef } from "@/rendering/d3-graphics";
import { Body } from "@/simulation/body";
import { EntityState } from "@/simulation/entity";
import { EdgeIndex, update } from "@/simulation/physics";

interface GraphViewProps {
  graph: JsonGraph;
  seed: number | null;
}

export function GraphView({ graph, seed }: GraphViewProps) {
  const RADIUS = 8;
  // Pixels per world unit. Fixed so resizing the window reveals more of the scene
  // rather than rescaling it; 0.5 matches the previous 500px ÷ 1000-unit view.
  const SCALE = 0.5;

  const nodes = useRef<Body[]>([]);
  const edgeIndices = useRef<EdgeIndex[]>([]);
  const svgContainer = useRef<SVGSVGElement>(null);
  const d3Graphics = useRef<D3Graphics<Body> | null>(null);

  const center: Vector = { x: 0, y: 0 };

  function onClickNode(node: Body) {
    console.log(`Clicked node: ${node.id}`);
  }

  function onUpdate(_: number, deltaTime: number) {
    update(nodes.current, edgeIndices.current, deltaTime, center);
  }

  useEffect(() => {
    if (!svgContainer.current) {
      return;
    }

    // Ensure D3Graphics is initialized only once
    if (!d3Graphics.current) {
      const rng = seed !== null ? new Random(seed) : random;
      const generationRadius = 50;

      nodes.current = graph.nodes.map((node) => ({
        id: node.id,
        position: {
          x: rng.float(center.x - generationRadius, center.x + generationRadius),
          y: rng.float(center.y - generationRadius, center.y + generationRadius),
        },
        velocity: VectorImpl.origin(),
        publisher: new Publisher<EntityState>(),
      }));

      const nodeIndexMap = new Map(nodes.current.map((n, i) => [n.id, i]));
      edgeIndices.current = graph.links
        .map((link) => ({ i: nodeIndexMap.get(link.source)!, j: nodeIndexMap.get(link.target)! }))
        .filter((e) => e.i !== undefined && e.j !== undefined);

      const nodeMap = new Map(nodes.current.map((n) => [n.id, n]));
      const edgeRefs: EdgeRef<Body>[] = graph.links
        .map((link) => ({ source: nodeMap.get(link.source)!, target: nodeMap.get(link.target)! }))
        .filter((e) => e.source && e.target);

      d3Graphics.current = new D3Graphics(
        svgContainer.current,
        center,
        RADIUS,
        nodes.current,
        edgeRefs,
        onUpdate,
        onClickNode
      );
      d3Graphics.current.start();
    }

    // Drive the viewBox from the element's live pixel size: size it once now
    // (avoids a first-frame flash) and again whenever the element resizes.
    const svg = svgContainer.current;
    const applyResize = () => d3Graphics.current?.resize(svg.clientWidth, svg.clientHeight, SCALE);
    applyResize();
    const observer = new ResizeObserver(applyResize);
    observer.observe(svg);

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <svg ref={svgContainer} className="block h-full w-full bg-tree-green fill-light-green" />;
}
