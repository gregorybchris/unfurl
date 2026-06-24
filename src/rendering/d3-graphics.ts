import { Subscriber } from "@/events/pubsub";
import { Vec2 } from "@/math/vec2";
import { Vec3 } from "@/math/vec3";
import { IEntity } from "@/simulation/entity";
import * as d3 from "d3";
import { AnimationGraphics, UpdateFuncType } from "./animation-graphics";

export type EdgeRef<Entity> = { source: Entity; target: Entity; value?: number };

export type ProjectionFn = (worldPos: Vec3) => { x: number; y: number; scale: number; depth: number };

const GROUP_COLORS = [
  '#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#c084fc',
  '#34d399', '#fb923c', '#38bdf8', '#a78bfa', '#f472b6',
  '#a3e635', '#2dd4bf',
];

export interface D3GraphicsOptions<Entity> {
  onNodeHover?: (entity: Entity, clientX: number, clientY: number) => void;
  onEdgeHover?: (edge: EdgeRef<Entity>, clientX: number, clientY: number) => void;
  onHoverEnd?: () => void;
  nodeGroupMap?: Map<string, number>;
  projectionFn?: ProjectionFn;
  onNodeDragDelta?: (entity: Entity, svgDx: number, svgDy: number) => void;
}

type DragState<Entity> = { entity: Entity; lastMouse: Vec2 };

const defaultProjection: ProjectionFn = (pos) => ({ x: pos.x, y: pos.y, scale: 1, depth: 0 });

export class D3Graphics<Entity extends IEntity> {
  container: SVGSVGElement;
  center: Vec2;
  radius: number;
  entities: Entity[];
  edges: EdgeRef<Entity>[];
  onUpdate: UpdateFuncType;
  onEntityClick: (entity: Entity) => void;
  animationGraphics: AnimationGraphics;
  canvas: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private elementMap = new Map<string, SVGCircleElement>();
  private hitElementMap = new Map<string, SVGCircleElement>();
  private lineElements: SVGLineElement[] = [];
  private hitLineElements: SVGLineElement[] = [];
  private edgeBaseWidths: number[] = [];
  private linkWidthEnabled = false;
  private dragState: DragState<Entity> | null = null;
  private opts: D3GraphicsOptions<Entity>;
  private nodeGroupMap: Map<string, number>;

  constructor(
    container: SVGSVGElement,
    center: Vec2,
    radius: number,
    entities: Entity[],
    edges: EdgeRef<Entity>[],
    onUpdate: UpdateFuncType,
    onEntityClick: (entity: Entity) => void,
    options: D3GraphicsOptions<Entity> = {},
  ) {
    this.container = container;
    this.center = center;
    this.radius = radius;
    this.entities = entities;
    this.edges = edges;
    this.onUpdate = onUpdate;
    this.onEntityClick = onEntityClick;
    this.opts = options;
    this.nodeGroupMap = options.nodeGroupMap ?? new Map();

    this.animationGraphics = new AnimationGraphics((currentTime, deltaTime) => {
      this.onUpdate(currentTime, deltaTime);
      this.updateLines();
    });

    // The viewBox is driven by `resize()` from the element's live pixel size, so
    // preserveAspectRatio never actually has to letterbox (the box matches the
    // element's aspect ratio); it stays as a harmless centered default.
    this.canvas = d3.select(container).attr("preserveAspectRatio", "xMidYMid meet");

    this.addLines();
    this.addCircles();

    this.entities.forEach((entity: Entity) => {
      const subscriber = new Subscriber<Entity>(this.updateCircle.bind(this));
      subscriber.subscribe(entity.publisher);
    });
  }

  private project(pos: Vec3) {
    return (this.opts.projectionFn ?? defaultProjection)(pos);
  }

  // Map the element's pixel size onto a world-space viewBox centered on the focal
  // point, at a fixed `scale` (px per world unit). A larger element therefore
  // reveals more of the scene around the center instead of rescaling the content.
  resize(pixelWidth: number, pixelHeight: number, scale: number): void {
    const worldWidth = pixelWidth / scale;
    const worldHeight = pixelHeight / scale;
    const x = this.center.x - worldWidth / 2;
    const y = this.center.y - worldHeight / 2;
    this.canvas.attr("viewBox", `${x} ${y} ${worldWidth} ${worldHeight}`);
  }

  update(currentTime: number, deltaTime: number): void {
    this.onUpdate(currentTime, deltaTime);
    this.updateLines();
  }

  start() {
    this.animationGraphics.start();
  }

  getSvgElementId(entity: Entity): string {
    return `entity-${entity.id}`;
  }

  private clientToSVG(event: MouseEvent): Vec2 {
    const svgEl = this.canvas.node()!;
    const pt = svgEl.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }

  private onDragMove(event: MouseEvent): void {
    if (!this.dragState) return;
    const mouse = this.clientToSVG(event);
    const dx = mouse.x - this.dragState.lastMouse.x;
    const dy = mouse.y - this.dragState.lastMouse.y;
    this.dragState.lastMouse = mouse;

    const { entity } = this.dragState;
    if (this.opts.onNodeDragDelta) {
      this.opts.onNodeDragDelta(entity, dx, dy);
    } else {
      entity.position.x += dx;
      entity.position.y += dy;
    }
    entity.publisher.publish({ id: entity.id, position: entity.position });
  }

  private beginNodeDrag(event: MouseEvent, entity: Entity): void {
    event.preventDefault();
    entity.pinned = true;
    this.opts.onHoverEnd?.();
    this.canvas.style("cursor", "grabbing");
    const lastMouse = this.clientToSVG(event);
    this.dragState = { entity, lastMouse };

    const onMove = (e: MouseEvent) => this.onDragMove(e);
    const onUp = () => {
      entity.pinned = false;
      this.dragState = null;
      this.canvas.style("cursor", null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  setNodeColors(enabled: boolean): void {
    for (const [id, el] of this.elementMap) {
      if (enabled) {
        const group = this.nodeGroupMap.get(id);
        el.setAttribute("fill", GROUP_COLORS[(group ?? 0) % GROUP_COLORS.length]);
      } else {
        el.removeAttribute("fill");
      }
    }
  }

  addLines() {
    const vals = this.edges.map(e => e.value).filter((v): v is number => v !== undefined);
    const minVal = vals.length ? Math.min(...vals) : 1;
    const maxVal = vals.length ? Math.max(...vals) : 1;
    const minPx = 1, maxPx = 8;
    this.edgeBaseWidths = this.edges.map(e =>
      e.value === undefined || minVal === maxVal
        ? 2
        : minPx + ((e.value - minVal) / (maxVal - minVal)) * (maxPx - minPx)
    );

    const linesGroup = this.canvas.append("g").attr("id", "edges-group");
    const groupEl = linesGroup.node()!;
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const ps = this.project(edge.source.position);
      const pt = this.project(edge.target.position);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(ps.x));
      line.setAttribute("y1", String(ps.y));
      line.setAttribute("x2", String(pt.x));
      line.setAttribute("y2", String(pt.y));
      line.setAttribute("class", "edge-visual");
      line.style.pointerEvents = "none";
      groupEl.appendChild(line);
      this.lineElements.push(line);

      // Invisible wider line for hover hit detection.
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hit.setAttribute("x1", String(ps.x));
      hit.setAttribute("y1", String(ps.y));
      hit.setAttribute("x2", String(pt.x));
      hit.setAttribute("y2", String(pt.y));
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "20");
      hit.style.cursor = "crosshair";
      hit.addEventListener("mousemove", (e: MouseEvent) => {
        if (this.dragState) return;
        this.opts.onEdgeHover?.(edge, e.clientX, e.clientY);
      });
      hit.addEventListener("mouseleave", () => {
        this.opts.onHoverEnd?.();
      });
      groupEl.appendChild(hit);
      this.hitLineElements.push(hit);
    }
  }

  updateLines() {
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const ps = this.project(edge.source.position);
      const pt = this.project(edge.target.position);
      const line = this.lineElements[i];
      line.setAttribute("x1", String(ps.x));
      line.setAttribute("y1", String(ps.y));
      line.setAttribute("x2", String(pt.x));
      line.setAttribute("y2", String(pt.y));
      const avgScale = (ps.scale + pt.scale) / 2;
      const baseWidth = this.linkWidthEnabled ? this.edgeBaseWidths[i] : 2;
      line.style.strokeWidth = `${baseWidth * avgScale}px`;
      const hit = this.hitLineElements[i];
      hit.setAttribute("x1", String(ps.x));
      hit.setAttribute("y1", String(ps.y));
      hit.setAttribute("x2", String(pt.x));
      hit.setAttribute("y2", String(pt.y));
    }
  }

  setLinkWidth(enabled: boolean): void {
    this.linkWidthEnabled = enabled;
  }

  addCircles() {
    const entitiesGroup = this.canvas.append("g").attr("id", "entities-group");
    const hitRadius = this.radius * 2;

    // Visible circles — no pointer events so the hit layer takes precedence.
    entitiesGroup
      .selectAll("circle.node-visual")
      .data(this.entities)
      .enter()
      .append("circle")
      .attr("class", "node-visual")
      .attr("cx", (entity) => this.project(entity.position).x)
      .attr("cy", (entity) => this.project(entity.position).y)
      .attr("r", (entity) => this.radius * this.project(entity.position).scale)
      .attr("id", (entity) => this.getSvgElementId(entity))
      .style("pointer-events", "none")
      .each((entity, _i, nodes) => {
        const el = nodes[_i] as SVGCircleElement;
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = entity.id;
        el.appendChild(title);
        this.elementMap.set(entity.id, el);
      });

    // Invisible hit circles — fixed screen-space radius for consistent hit area.
    entitiesGroup
      .selectAll("circle.node-hit")
      .data(this.entities)
      .enter()
      .append("circle")
      .attr("class", "node-hit")
      .attr("cx", (entity) => this.project(entity.position).x)
      .attr("cy", (entity) => this.project(entity.position).y)
      .attr("r", hitRadius)
      .attr("id", (entity) => `${this.getSvgElementId(entity)}-hit`)
      .attr("fill", "transparent")
      .style("cursor", "grab")
      .on("mousedown", (event: MouseEvent, entity) => {
        if (event.metaKey || event.shiftKey) return;
        this.beginNodeDrag(event, entity);
      })
      .on("click", (_, entity) => {
        this.onEntityClick(entity);
      })
      .on("mousemove", (event: MouseEvent, entity) => {
        if (this.dragState) return;
        this.opts.onNodeHover?.(entity, event.clientX, event.clientY);
      })
      .on("mouseleave", () => {
        this.opts.onHoverEnd?.();
      })
      .each((entity, _i, nodes) => {
        this.hitElementMap.set(entity.id, nodes[_i] as SVGCircleElement);
      });
  }

  updateCircle(entity: Entity) {
    const p = this.project(entity.position);
    const el = this.elementMap.get(entity.id);
    if (el) {
      el.setAttribute("cx", String(p.x));
      el.setAttribute("cy", String(p.y));
      el.setAttribute("r", String(this.radius * p.scale));
      el.setAttribute("fill-opacity", String(Math.max(0.2, Math.min(1, p.scale))));
    }
    const hit = this.hitElementMap.get(entity.id);
    if (hit) {
      hit.setAttribute("cx", String(p.x));
      hit.setAttribute("cy", String(p.y));
    }
  }

  // Re-sort node SVG elements by depth so closer nodes paint over farther ones.
  sortByDepth(): void {
    const group = this.canvas.select<SVGGElement>("#entities-group").node();
    if (!group) return;
    const entries = [...this.elementMap.entries()].map(([id, el]) => {
      const entity = this.entities.find((e) => e.id === id)!;
      return { el, hitEl: this.hitElementMap.get(id)!, depth: this.project(entity.position).depth };
    });
    // Sort descending by depth (most distant first = painted underneath)
    entries.sort((a, b) => b.depth - a.depth);
    for (const { el, hitEl } of entries) {
      group.appendChild(el);
      group.appendChild(hitEl);
    }
  }
}
