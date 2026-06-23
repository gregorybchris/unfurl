import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraphView } from "./graph-view";
import { JsonGraph } from "@/graph/graph";
import { defaultPhysicsConfig } from "@/simulation/physics-config";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const graph: JsonGraph = {
  nodes: [
    { id: "A", group: 1 },
    { id: "B", group: 1 },
  ],
  links: [{ source: "A", target: "B", value: 1 }],
};

describe("GraphView", () => {
  it("renders an svg element", () => {
    const { container } = render(
      <GraphView graph={graph} seed={null} physicsConfig={defaultPhysicsConfig} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("initializes the d3 simulation with node circles", () => {
    const { container } = render(
      <GraphView graph={graph} seed={null} physicsConfig={defaultPhysicsConfig} />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.querySelectorAll("circle").length).toBeGreaterThan(0);
  });
});
