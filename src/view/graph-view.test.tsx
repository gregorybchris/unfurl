import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraphView } from "./graph-view";
import { JsonGraph } from "@/graph/graph";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GraphView", () => {
  it("renders an svg element", () => {
    const graph: JsonGraph = { nodes: [{ id: "A", group: 1 }, { id: "B", group: 1 }], links: [{ source: "A", target: "B", value: 1 }] };
    const { container } = render(<GraphView graph={graph} seed={null} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("initializes the d3 simulation with node circles", () => {
    const graph: JsonGraph = { nodes: [{ id: "A", group: 1 }, { id: "B", group: 1 }], links: [{ source: "A", target: "B", value: 1 }] };
    const { container } = render(<GraphView graph={graph} seed={null} />);
    const svg = container.querySelector("svg")!;

    expect(svg.querySelectorAll("circle").length).toBeGreaterThan(0);
  });
});
