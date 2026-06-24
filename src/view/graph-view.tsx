import random, { Random } from "random";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Publisher } from "@/events/pubsub";
import { AdjMatrix, JsonGraph } from "@/graph/graph";
import { Vec3, Vec3Impl } from "@/math/vec3";
import { ProjectionFn, D3Graphics, EdgeRef } from "@/rendering/d3-graphics";
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

export type DimensionMode = '2d' | '3d';

const DEFAULT_SCALE = 0.5;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const DEFAULT_CAMERA_DISTANCE = 600;

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
  nodeColors?: boolean;
  dimensionMode?: DimensionMode;
}

export const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(function GraphView(
  {
    graph,
    seed,
    physicsConfig = defaultPhysicsConfig,
    graphDistances = [],
    nodeDegrees = [],
    eigenvectorCentrality = [],
    nodeColors = false,
    dimensionMode = '2d',
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

  const dimensionModeRef = useRef<DimensionMode>(dimensionMode);
  dimensionModeRef.current = dimensionMode;

  const nodes = useRef<Body[]>([]);
  const edgeIndices = useRef<EdgeIndex[]>([]);
  const svgContainer = useRef<SVGSVGElement>(null);
  const d3Graphics = useRef<D3Graphics<Body> | null>(null);

  const physicsConfigRef = useRef<PhysicsConfig>(physicsConfig);
  physicsConfigRef.current = physicsConfig;

  // Camera state stored in a ref to avoid re-renders on every pointer move.
  const cameraRef = useRef({
    panX: 0,
    panY: 0,
    theta: 0.4,       // horizontal orbit angle
    phi: 0.25,        // vertical orbit angle
    distance: DEFAULT_CAMERA_DISTANCE,
    // Derived camera basis vectors (updated when angles change)
    rightVec: { x: 1, y: 0, z: 0 } as Vec3,
    upVec: { x: 0, y: 1, z: 0 } as Vec3,
  });

  // The active projection function — read by D3Graphics via a stable wrapper closure.
  const projectionFnRef = useRef<ProjectionFn>((pos) => ({ x: pos.x, y: pos.y, scale: 1, depth: 0 }));

  function make2DProjection(): ProjectionFn {
    return (pos: Vec3) => ({ x: pos.x, y: pos.y, scale: 1, depth: 0 });
  }

  function make3DProjection(): ProjectionFn {
    const cam = cameraRef.current;
    const { theta, phi, distance } = cam;

    // Camera position in world space (spherical coordinates)
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const camX = distance * cosP * sinT;
    const camY = distance * sinP;
    const camZ = distance * cosP * cosT;

    // Build orthonormal camera basis
    const forwardLen = Math.sqrt(camX * camX + camY * camY + camZ * camZ);
    const fx = -camX / forwardLen, fy = -camY / forwardLen, fz = -camZ / forwardLen;

    // Right = forward × worldUp, then normalize
    const worldUpX = 0, worldUpY = 1, worldUpZ = 0;
    let rx = fy * worldUpZ - fz * worldUpY;
    let ry = fz * worldUpX - fx * worldUpZ;
    let rz = fx * worldUpY - fy * worldUpX;
    const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    rx /= rLen; ry /= rLen; rz /= rLen;

    // Up = right × forward
    let ux = ry * fz - rz * fy;
    let uy = rz * fx - rx * fz;
    let uz = rx * fy - ry * fx;
    const uLen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= uLen; uy /= uLen; uz /= uLen;

    // Store basis vectors for drag unprojection
    cam.rightVec = { x: rx, y: ry, z: rz };
    cam.upVec = { x: ux, y: uy, z: uz };

    // screenScale provides actual zoom: changing distance scales all projected coords
    const screenScale = DEFAULT_CAMERA_DISTANCE / distance;

    return (worldPos: Vec3) => {
      // Translate by pan offset (shifts the orbit center)
      const px = worldPos.x - cam.panX;
      const py = worldPos.y - cam.panY;
      const pz = worldPos.z;

      // Rotate to camera space (cz = distance from camera along forward axis)
      const cx = px * rx + py * ry + pz * rz;
      const cy = px * ux + py * uy + pz * uz;
      const cz = px * fx + py * fy + pz * fz + distance;

      // Perspective divide: scale = focalLength / depth, then apply zoom
      const w = (distance / Math.max(1, cz)) * screenScale;
      return { x: cx * w, y: -cy * w, scale: w, depth: cz };
    };
  }

  function rebuildProjection() {
    projectionFnRef.current = dimensionModeRef.current === '3d'
      ? make3DProjection()
      : make2DProjection();
  }

  function forceRedrawAll() {
    const g = d3Graphics.current;
    if (!g) return;
    for (const node of nodes.current) {
      g.updateCircle(node);
    }
    g.updateLines();
    if (dimensionModeRef.current === '3d') g.sortByDepth();
  }

  function updateCameraAndRedraw() {
    if (dimensionModeRef.current === '2d') {
      // 2D pan is pure viewBox movement — no need to rebuild projection or touch circles
      if (svgContainer.current && d3Graphics.current) {
        d3Graphics.current.center = { x: cameraRef.current.panX, y: cameraRef.current.panY };
        d3Graphics.current.resize(svgContainer.current.clientWidth, svgContainer.current.clientHeight, displayScaleRef.current);
      }
    } else {
      rebuildProjection();
      forceRedrawAll();
    }
  }

  useImperativeHandle(ref, () => ({
    addHeat: () => addHeat(nodes.current),
    zoomBy: (factor: number) => {
      if (dimensionModeRef.current === '3d') {
        cameraRef.current.distance = Math.max(100, Math.min(5000, cameraRef.current.distance / factor));
        rebuildProjection();
        forceRedrawAll();
      } else {
        setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor)));
      }
    },
    resetZoom: () => {
      cameraRef.current.panX = 0;
      cameraRef.current.panY = 0;
      if (dimensionModeRef.current === '3d') {
        cameraRef.current.distance = DEFAULT_CAMERA_DISTANCE;
        cameraRef.current.theta = 0.4;
        cameraRef.current.phi = 0.25;
        rebuildProjection();
        forceRedrawAll();
      } else {
        if (d3Graphics.current) d3Graphics.current.center = { x: 0, y: 0 };
        setScale(DEFAULT_SCALE);
      }
    },
  }));

  function onClickNode(node: Body) {
    console.log(`Clicked node: ${node.id}`);
  }

  function onUpdate(_: number, deltaTime: number) {
    // Smoothly lerp the display scale toward the target each frame (2D mode only).
    if (dimensionModeRef.current === '2d') {
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
    }

    update(
      nodes.current,
      edgeIndices.current,
      deltaTime,
      // Gravity always at world origin — pan is pure viewport navigation
      Vec3Impl.origin(),
      physicsConfigRef.current,
      graphDistances,
      nodeDegrees,
      eigenvectorCentrality,
    );

    // Constrain z to 0 in 2D mode
    if (dimensionModeRef.current === '2d') {
      for (const node of nodes.current) {
        node.position.z = 0;
        node.velocity.z = 0;
      }
    }

    // Z-sort in 3D
    if (dimensionModeRef.current === '3d') {
      d3Graphics.current?.sortByDepth();
    }
  }

  // Pan and rotate drag state
  const panDragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const rotateDragRef = useRef<{ startX: number; startY: number; startTheta: number; startPhi: number } | null>(null);

  function onSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    // Allow modifier-key drags (pan/rotate) even when clicking on a node
    if (!e.metaKey && !e.shiftKey && (e.target as Element).closest('.node-hit')) return;

    if (e.metaKey) {
      e.preventDefault();
      panDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: cameraRef.current.panX,
        startPanY: cameraRef.current.panY,
      };
    } else if (e.shiftKey && dimensionModeRef.current === '3d') {
      e.preventDefault();
      rotateDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTheta: cameraRef.current.theta,
        startPhi: cameraRef.current.phi,
      };
    }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (panDragRef.current) {
        const { startX, startY, startPanX, startPanY } = panDragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dimensionModeRef.current === '2d') {
          // In 2D, mouse pixels map to world units via display scale
          cameraRef.current.panX = startPanX - dx / displayScaleRef.current;
          cameraRef.current.panY = startPanY - dy / displayScaleRef.current;
        } else {
          // In 3D, pan is a screen-space shift applied inside the projection
          cameraRef.current.panX = startPanX - dx / (cameraRef.current.distance / DEFAULT_CAMERA_DISTANCE);
          cameraRef.current.panY = startPanY + dy / (cameraRef.current.distance / DEFAULT_CAMERA_DISTANCE);
        }
        updateCameraAndRedraw();
      } else if (rotateDragRef.current) {
        const { startX, startY, startTheta, startPhi } = rotateDragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        cameraRef.current.theta = startTheta + dx * 0.005;
        cameraRef.current.phi = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, startPhi - dy * 0.005));
        updateCameraAndRedraw();
      }
    };

    const onMouseUp = () => {
      panDragRef.current = null;
      rotateDragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!svgContainer.current) return;

    if (!d3Graphics.current) {
      const rng = seed !== null ? new Random(seed) : random;
      const generationRadius = 50;
      const center = { x: 0, y: 0, z: 0 } as Vec3;

      nodes.current = graph.nodes.map((node) => ({
        id: node.id,
        position: Vec3Impl.fromXY(
          rng.float(center.x - generationRadius, center.x + generationRadius),
          rng.float(center.y - generationRadius, center.y + generationRadius),
        ),
        velocity: Vec3Impl.origin(),
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

      // Stable projection wrapper that always reads the current projection function
      const stableProjectionFn: ProjectionFn = (pos) => projectionFnRef.current(pos);

      rebuildProjection();

      d3Graphics.current = new D3Graphics(
        svgContainer.current,
        { x: 0, y: 0 },
        RADIUS,
        nodes.current,
        edgeRefs,
        onUpdate,
        onClickNode,
        {
          nodeGroupMap,
          projectionFn: stableProjectionFn,
          onNodeDragDelta: (entity, svgDx, svgDy) => {
            if (dimensionModeRef.current === '2d') {
              entity.position.x += svgDx;
              entity.position.y += svgDy;
            } else {
              // Unproject screen delta to world space using camera basis vectors
              const cam = cameraRef.current;
              const proj = projectionFnRef.current(entity.position);
              const invScale = proj.scale > 0 ? 1 / proj.scale : 1;
              entity.position.x += (cam.rightVec.x * svgDx - cam.upVec.x * svgDy) * invScale;
              entity.position.y += (cam.rightVec.y * svgDx - cam.upVec.y * svgDy) * invScale;
              entity.position.z += (cam.rightVec.z * svgDx - cam.upVec.z * svgDy) * invScale;
            }
          },
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
    const applyResize = () => {
      if (dimensionModeRef.current === '2d') {
        d3Graphics.current?.resize(svg.clientWidth, svg.clientHeight, scaleRef.current);
      }
    };
    applyResize();
    const observer = new ResizeObserver(applyResize);
    observer.observe(svg);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.93 : 1.07;
      if (dimensionModeRef.current === '3d') {
        cameraRef.current.distance = Math.max(100, Math.min(5000, cameraRef.current.distance / factor));
        rebuildProjection();
        forceRedrawAll();
      } else {
        setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor)));
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      svg.removeEventListener("wheel", onWheel);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to dimension mode changes
  useEffect(() => {
    if (dimensionMode === '2d') {
      // Snap all nodes to the XY plane immediately
      for (const node of nodes.current) {
        node.position.z = 0;
        node.velocity.z = 0;
      }
      // Restore 2D viewBox centered on pan position
      if (svgContainer.current && d3Graphics.current) {
        const svg = svgContainer.current;
        d3Graphics.current.center = { x: cameraRef.current.panX, y: cameraRef.current.panY };
        d3Graphics.current.resize(svg.clientWidth, svg.clientHeight, displayScaleRef.current);
      }
    } else {
      // Add random z perturbation to break XY-plane symmetry
      for (const node of nodes.current) {
        node.position.z += (Math.random() - 0.5) * 20;
        node.velocity.z += (Math.random() - 0.5) * 0.5;
      }
      // Switch to 3D: set viewBox to 1:1 pixel mapping centered on origin
      if (svgContainer.current && d3Graphics.current) {
        const svg = svgContainer.current;
        const w = svg.clientWidth, h = svg.clientHeight;
        d3Graphics.current.canvas.attr("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`);
      }
    }
    rebuildProjection();
    forceRedrawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensionMode]);

  useEffect(() => {
    d3Graphics.current?.setNodeColors(nodeColors);
  }, [nodeColors]);

  const cursorStyle = panDragRef.current ? 'grabbing' : rotateDragRef.current ? 'all-scroll' : undefined;

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgContainer}
        className="block h-full w-full bg-surface fill-accent-soft"
        style={{ cursor: cursorStyle }}
        onMouseDown={onSvgMouseDown}
      />
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-accent/20 bg-tooltip/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="text-[12px] font-medium text-accent-soft">{tooltip.content}</div>
          {tooltip.sub && (
            <div className="text-[10px] text-accent/60 mt-0.5">{tooltip.sub}</div>
          )}
        </div>
      )}
      {dimensionMode === '3d' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] text-accent/40 select-none">
          Shift+drag to rotate · ⌘+drag to pan
        </div>
      )}
    </div>
  );
});
