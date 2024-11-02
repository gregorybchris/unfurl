import * as d3 from "d3";
import { AnimationGraphics, UpdateFuncType } from "./animation-graphics";
import { Vector } from "./math";
import { Publisher, Subscriber } from "./pubsub";

export interface EntityState {
  id: string;
  position: Vector;
}

export interface IEntity {
  id: string;
  position: Vector;
  publisher: Publisher<EntityState>;
}

export class D3Graphics<Entity extends IEntity> {
  container: SVGSVGElement;
  width: number;
  height: number;
  entities: Entity[];
  onUpdate: UpdateFuncType;
  onEntityClick: (entity: Entity) => void;
  animationGraphics: AnimationGraphics;
  canvas: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  constructor(
    container: SVGSVGElement,
    width: number,
    height: number,
    entities: Entity[],
    onUpdate: UpdateFuncType,
    onEntityClick: (entity: Entity) => void
  ) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.entities = entities;
    this.onUpdate = onUpdate;
    this.onEntityClick = onEntityClick;

    this.animationGraphics = new AnimationGraphics(this.onUpdate);

    this.canvas = d3
      .select(container)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);

    this.addBackground();
    this.addCircles();

    this.entities.forEach((entity: Entity) => {
      const subscriber = new Subscriber<Entity>(this.updateCircle.bind(this));
      subscriber.subscribe(entity.publisher);
    });
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

  addBackground() {
    const background = this.canvas.append("rect");
    background.attr("fill", "#F5F5F5").attr("width", this.width).attr("height", this.height);
  }

  addCircles() {
    const fill = "#5FC193";
    const radius = 8;

    const entitiesGroup = this.canvas.append("g").attr("id", "entities-group");
    const entityCircles = entitiesGroup
      .selectAll("circle")
      .data(this.entities)
      .enter()
      .append("circle")
      .attr("cx", (entity) => entity.position.x)
      .attr("cy", (entity) => entity.position.y)
      .attr("r", radius)
      .attr("fill", fill)
      .attr("id", (entity) => this.getSvgElementId(entity))
      .on("click", (_, entity) => {
        this.onEntityClick(entity);
      });
    entityCircles.append("title").text((entity) => entity.id);
  }

  updateCircle(entity: Entity) {
    const entitySelection = d3.select(`#${this.getSvgElementId(entity)}`);
    entitySelection.attr("cx", entity.position.x);
    entitySelection.attr("cy", entity.position.y);
  }
}
