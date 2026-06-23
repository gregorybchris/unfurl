import * as d3 from "d3";
import { Subscriber } from "@/events/pubsub";
import { Vector } from "@/math/math";
import { IEntity } from "@/simulation/entity";
import { AnimationGraphics, UpdateFuncType } from "./animation-graphics";

export class D3Graphics<Entity extends IEntity> {
  container: SVGSVGElement;
  center: Vector;
  radius: number;
  entities: Entity[];
  onUpdate: UpdateFuncType;
  onEntityClick: (entity: Entity) => void;
  animationGraphics: AnimationGraphics;
  canvas: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private elementMap = new Map<string, SVGCircleElement>();

  constructor(
    container: SVGSVGElement,
    center: Vector,
    radius: number,
    entities: Entity[],
    onUpdate: UpdateFuncType,
    onEntityClick: (entity: Entity) => void
  ) {
    this.container = container;
    this.center = center;
    this.radius = radius;
    this.entities = entities;
    this.onUpdate = onUpdate;
    this.onEntityClick = onEntityClick;

    this.animationGraphics = new AnimationGraphics(this.onUpdate);

    // The viewBox is driven by `resize()` from the element's live pixel size, so
    // preserveAspectRatio never actually has to letterbox (the box matches the
    // element's aspect ratio); it stays as a harmless centered default.
    this.canvas = d3.select(container).attr("preserveAspectRatio", "xMidYMid meet");

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
  }

  start() {
    this.animationGraphics.start();
  }

  getSvgElementId(entity: Entity): string {
    return `entity-${entity.id}`;
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
