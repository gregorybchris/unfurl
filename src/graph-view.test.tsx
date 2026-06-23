import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraphView } from "./graph-view";
import { Graph } from "./lib/graph";

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
    const graph: Graph = { A: ["B"], B: [] };
    const { container } = render(<GraphView graph={graph} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("initializes the d3 simulation with a background and node circles", () => {
    const graph: Graph = { A: ["B"], B: [] };
    const { container } = render(<GraphView graph={graph} />);
    const svg = container.querySelector("svg")!;

    expect(svg.querySelector("rect")).not.toBeNull();
    expect(svg.querySelectorAll("circle").length).toBeGreaterThan(0);
  });
});
