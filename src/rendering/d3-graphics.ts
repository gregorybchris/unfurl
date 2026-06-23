import { Subscriber } from "@/events/pubsub";
import { Vector } from "@/math/math";
import { IEntity } from "@/simulation/entity";
import * as d3 from "d3";
import { AnimationGraphics, UpdateFuncType } from "./animation-graphics";

export type EdgeRef<Entity> = { source: Entity; target: Entity };

type DragState<Entity> = { entity: Entity; lastMouse: Vector };

export class D3Graphics<Entity extends IEntity> {
  container: SVGSVGElement;
  center: Vector;
  radius: number;
  entities: Entity[];
  edges: EdgeRef<Entity>[];
  onUpdate: UpdateFuncType;
  onEntityClick: (entity: Entity) => void;
  animationGraphics: AnimationGraphics;
  canvas: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private elementMap = new Map<string, SVGCircleElement>();
  private lineElements: SVGLineElement[] = [];
  private dragState: DragState<Entity> | null = null;

  constructor(
    container: SVGSVGElement,
    center: Vector,
    radius: number,
    entities: Entity[],
    edges: EdgeRef<Entity>[],
    onUpdate: UpdateFuncType,
    onEntityClick: (entity: Entity) => void,
  ) {
    this.container = container;
    this.center = center;
    this.radius = radius;
    this.entities = entities;
    this.edges = edges;
    this.onUpdate = onUpdate;
    this.onEntityClick = onEntityClick;

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

  private clientToSVG(event: MouseEvent): Vector {
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
    entity.position.x += dx;
    entity.position.y += dy;
    entity.publisher.publish({ id: entity.id, position: { x: entity.position.x, y: entity.position.y } });
  }

  private beginNodeDrag(event: MouseEvent, entity: Entity): void {
    event.preventDefault();
    entity.pinned = true;
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

  addLines() {
    const linesGroup = this.canvas.append("g").attr("id", "edges-group");
    const groupEl = linesGroup.node()!;
    for (const edge of this.edges) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(edge.source.position.x));
      line.setAttribute("y1", String(edge.source.position.y));
      line.setAttribute("x2", String(edge.target.position.x));
      line.setAttribute("y2", String(edge.target.position.y));
      line.setAttribute("stroke", "RGBA(126, 168, 128, 0.5)");
      line.setAttribute("stroke-width", "4");
      groupEl.appendChild(line);
      this.lineElements.push(line);
    }
  }

  updateLines() {
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const line = this.lineElements[i];
      line.setAttribute("x1", String(edge.source.position.x));
      line.setAttribute("y1", String(edge.source.position.y));
      line.setAttribute("x2", String(edge.target.position.x));
      line.setAttribute("y2", String(edge.target.position.y));
    }
  }

  addCircles() {
    const entitiesGroup = this.canvas.append("g").attr("id", "entities-group");
    entitiesGroup
      .selectAll("circle")
      .data(this.entities)
      .enter()
      .append("circle")
      .attr("cx", (entity) => entity.position.x)
      .attr("cy", (entity) => entity.position.y)
      .attr("r", this.radius)
      .attr("id", (entity) => this.getSvgElementId(entity))
      .style("cursor", "grab")
      .on("mousedown", (event: MouseEvent, entity) => {
        this.beginNodeDrag(event, entity);
      })
      .on("click", (_, entity) => {
        this.onEntityClick(entity);
      })
      .each((entity, _i, nodes) => {
        this.elementMap.set(entity.id, nodes[_i] as SVGCircleElement);
      })
      .append("title")
      .text((entity) => entity.id);
  }

  updateCircle(entity: Entity) {
    const el = this.elementMap.get(entity.id);
    if (el) {
      el.setAttribute("cx", String(entity.position.x));
      el.setAttribute("cy", String(entity.position.y));
    }
  }
}
