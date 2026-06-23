import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { D3Graphics, EntityState, IEntity } from "./d3-graphics";
import { Publisher } from "./pubsub";

function makeEntity(id: string, x: number, y: number): IEntity {
  return { id, position: { x, y }, publisher: new Publisher<EntityState>() };
}

let container: SVGSVGElement;

beforeEach(() => {
  document.body.innerHTML = "";
  container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(container);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("D3Graphics", () => {
  it("renders a background rect and one circle per entity", () => {
    const entities = [makeEntity("a", 1, 2), makeEntity("b", 3, 4)];
    new D3Graphics(container, 100, 100, 5, entities, vi.fn(), vi.fn());

    expect(container.querySelector("rect")).not.toBeNull();
    expect(container.querySelector("#entities-group")).not.toBeNull();
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("positions circles using entity coordinates and radius", () => {
    const entities = [makeEntity("a", 1, 2)];
    new D3Graphics(container, 100, 100, 6, entities, vi.fn(), vi.fn());

    const circle = container.querySelector("#entity-a")!;
    expect(circle.getAttribute("cx")).toBe("1");
    expect(circle.getAttribute("cy")).toBe("2");
    expect(circle.getAttribute("r")).toBe("6");
    expect(circle.querySelector("title")?.textContent).toBe("a");
  });

  it("getSvgElementId derives an id from the entity", () => {
    const entities = [makeEntity("a", 1, 2)];
    const g = new D3Graphics(container, 100, 100, 5, entities, vi.fn(), vi.fn());
    expect(g.getSvgElementId(entities[0])).toBe("entity-a");
  });

  it("updateCircle moves the circle in the DOM", () => {
    const entities = [makeEntity("a", 1, 2)];
    const g = new D3Graphics(container, 100, 100, 5, entities, vi.fn(), vi.fn());

    entities[0].position = { x: 50, y: 60 };
    g.updateCircle(entities[0]);

    const circle = container.querySelector("#entity-a")!;
    expect(circle.getAttribute("cx")).toBe("50");
    expect(circle.getAttribute("cy")).toBe("60");
  });

  it("moves a circle when its entity publishes a new state", () => {
    const entities = [makeEntity("a", 1, 2)];
    new D3Graphics(container, 100, 100, 5, entities, vi.fn(), vi.fn());

    entities[0].publisher.publish({ id: "a", position: { x: 7, y: 8 } });

    const circle = container.querySelector("#entity-a")!;
    expect(circle.getAttribute("cx")).toBe("7");
    expect(circle.getAttribute("cy")).toBe("8");
  });

  it("invokes onEntityClick with the clicked entity", () => {
    const entities = [makeEntity("a", 1, 2), makeEntity("b", 3, 4)];
    const onClick = vi.fn();
    new D3Graphics(container, 100, 100, 5, entities, vi.fn(), onClick);

    container.querySelector("#entity-b")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onClick).toHaveBeenCalledWith(entities[1]);
  });

  it("update delegates to the provided onUpdate callback", () => {
    const onUpdate = vi.fn();
    const g = new D3Graphics(container, 100, 100, 5, [makeEntity("a", 1, 2)], onUpdate, vi.fn());

    g.update(10, 2);

    expect(onUpdate).toHaveBeenCalledWith(10, 2);
  });

  it("start kicks off the animation loop (one synchronous tick)", () => {
    vi.stubGlobal("requestAnimationFrame", () => 0);
    const onUpdate = vi.fn();
    const g = new D3Graphics(container, 100, 100, 5, [makeEntity("a", 1, 2)], onUpdate, vi.fn());

    g.start();

    expect(onUpdate).toHaveBeenCalledWith(0, 0);
  });
});
