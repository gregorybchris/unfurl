import random, { Random } from "random";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Publisher } from "@/events/pubsub";
import { AdjMatrix, JsonGraph } from "@/graph/graph";
import { Vector, VectorImpl } from "@/math/math";
import { D3Graphics, EdgeRef } from "@/rendering/d3-graphics";
import { Body } from "@/simulation/body";
import { EntityState } from "@/simulation/entity";
import { addHeat, EdgeIndex, update } from "@/simulation/physics";
import { defaultPhysicsConfig, PhysicsConfig } from "@/simulation/physics-config";

interface TooltipState {
  content: string;
  sub?: string;
  x: number;
  y: number;
}

const DEFAULT_SCALE = 0.5;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export interface GraphViewHandle {
  addHeat: () => void;
  zoomBy: (factor: number) => void;
  resetZoom: () => void;
}

interface GraphViewProps {
  graph: JsonGraph;
  seed: number | null;
  physicsConfig?: PhysicsConfig;
  graphDistances?: AdjMatrix;
  nodeDegrees?: number[];
  eigenvectorCentrality?: number[];
}

export const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(function GraphView(
  {
    graph,
    seed,
    physicsConfig = defaultPhysicsConfig,
    graphDistances = [],
    nodeDegrees = [],
    eigenvectorCentrality = [],
  },
  ref,
) {
  const RADIUS = 8;

  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  // Tracks the currently-rendered scale; lerped toward scaleRef each frame.
  const displayScaleRef = useRef(DEFAULT_SCALE);

  const nodes = useRef<Body[]>([]);
  const edgeIndices = useRef<EdgeIndex[]>([]);
  const svgContainer = useRef<SVGSVGElement>(null);
  const d3Graphics = useRef<D3Graphics<Body> | null>(null);

  const physicsConfigRef = useRef<PhysicsConfig>(physicsConfig);
  physicsConfigRef.current = physicsConfig;

  const center: Vector = { x: 0, y: 0 };

  useImperativeHandle(ref, () => ({
    addHeat: () => addHeat(nodes.current),
    zoomBy: (factor: number) =>
      setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor))),
    resetZoom: () => setScale(DEFAULT_SCALE),
  }));

  function onClickNode(node: Body) {
    console.log(`Clicked node: ${node.id}`);
  }

  function onUpdate(_: number, deltaTime: number) {
    // Smoothly lerp the display scale toward the target each frame.
    const target = scaleRef.current;
    const current = displayScaleRef.current;
    if (Math.abs(current - target) > 0.0005) {
      const factor = 1 - Math.exp(-deltaTime * 0.018);
      const next = current + (target - current) * factor;
      displayScaleRef.current = next;
      if (svgContainer.current && d3Graphics.current) {
        const svg = svgContainer.current;
        d3Graphics.current.resize(svg.clientWidth, svg.clientHeight, next);
      }
    }

    update(
      nodes.current,
      edgeIndices.current,
      deltaTime,
      center,
      physicsConfigRef.current,
      graphDistances,
      nodeDegrees,
      eigenvectorCentrality,
    );
  }

  useEffect(() => {
    if (!svgContainer.current) return;

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
        .map((link) => ({
          source: nodeMap.get(link.source)!,
          target: nodeMap.get(link.target)!,
          value: link.value,
        }))
        .filter((e) => e.source && e.target);

      const nodeGroupMap = new Map(graph.nodes.map((n) => [n.id, n.group]));
      const hasMultipleGroups = new Set(graph.nodes.map((n) => n.group)).size > 1;

      d3Graphics.current = new D3Graphics(
        svgContainer.current,
        center,
        RADIUS,
        nodes.current,
        edgeRefs,
        onUpdate,
        onClickNode,
        {
          onNodeHover: (entity, x, y) => {
            const group = hasMultipleGroups ? nodeGroupMap.get(entity.id) : undefined;
            setTooltip({ content: entity.id, sub: group !== undefined ? `group ${group}` : undefined, x, y });
          },
          onEdgeHover: (edge, x, y) => {
            const sub = edge.value !== undefined && edge.value > 1 ? `weight: ${edge.value}` : undefined;
            setTooltip({ content: `${edge.source.id} — ${edge.target.id}`, sub, x, y });
          },
          onHoverEnd: () => setTooltip(null),
        },
      );
      d3Graphics.current.start();
    }

    const svg = svgContainer.current;
    const applyResize = () =>
      d3Graphics.current?.resize(svg.clientWidth, svg.clientHeight, scaleRef.current);
    applyResize();
    const observer = new ResizeObserver(applyResize);
    observer.observe(svg);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.93 : 1.07;
      setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor)));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      svg.removeEventListener("wheel", onWheel);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      <svg ref={svgContainer} className="block h-full w-full bg-tree-green fill-light-green" />
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-sea-green/20 bg-[#162c28]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="text-[12px] font-medium text-light-green">{tooltip.content}</div>
          {tooltip.sub && (
            <div className="text-[10px] text-sea-green/60 mt-0.5">{tooltip.sub}</div>
          )}
        </div>
      )}
    </div>
  );
});
