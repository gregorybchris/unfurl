import { describe, expect, it } from "vitest";
import {
  fillAdjMatrixInf,
  getNodeIndex,
  graphDistance,
  graphToAdjMatrix,
  JsonGraph,
  jsonToGraph,
  makeSymmetric,
} from "./graph";
import { INF } from "./math";

const json: JsonGraph = {
  nodes: [
    { id: "A", group: 1 },
    { id: "B", group: 1 },
    { id: "C", group: 2 },
  ],
  links: [
    { source: "A", target: "B", value: 1 },
    { source: "B", target: "C", value: 1 },
  ],
};

describe("jsonToGraph", () => {
  it("builds an adjacency list keyed by node id", () => {
    expect(jsonToGraph(json)).toEqual({
      A: ["B"],
      B: ["C"],
      C: [],
    });
  });

  it("creates an entry for every node, even isolated ones", () => {
    const graph = jsonToGraph({ nodes: [{ id: "X", group: 0 }], links: [] });
    expect(graph).toEqual({ X: [] });
  });
});

describe("graphToAdjMatrix", () => {
  it("produces a directed adjacency matrix in key order", () => {
    const graph = jsonToGraph(json);
    expect(graphToAdjMatrix(graph)).toEqual([
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 0],
    ]);
  });
});

describe("makeSymmetric", () => {
  it("mirrors edges across the diagonal", () => {
    const matrix = [
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 0],
    ];
    expect(makeSymmetric(matrix)).toEqual([
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ]);
  });
});

describe("fillAdjMatrixInf", () => {
  it("replaces zeros with INF and leaves edges intact", () => {
    expect(
      fillAdjMatrixInf([
        [0, 1],
        [1, 0],
      ])
    ).toEqual([
      [INF, 1],
      [1, INF],
    ]);
  });

  it("does not mutate the input", () => {
    const matrix = [
      [0, 1],
      [1, 0],
    ];
    fillAdjMatrixInf(matrix);
    expect(matrix).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });
});

describe("getNodeIndex", () => {
  it("returns the index of a node by insertion order", () => {
    const graph = jsonToGraph(json);
    expect(getNodeIndex(graph, "A")).toBe(0);
    expect(getNodeIndex(graph, "C")).toBe(2);
    expect(getNodeIndex(graph, "missing")).toBe(-1);
  });
});

describe("graphDistance", () => {
  it("looks up the distance between two nodes in the matrix", () => {
    const graph = jsonToGraph(json);
    const matrix = [
      [0, 1, 2],
      [1, 0, 1],
      [2, 1, 0],
    ];
    expect(graphDistance(graph, matrix, "A", "C")).toBe(2);
    expect(graphDistance(graph, matrix, "B", "A")).toBe(1);
  });

  it("works end-to-end through the full pipeline (mirrors app.tsx)", () => {
    const graph = jsonToGraph(json);
    let matrix = graphToAdjMatrix(graph);
    matrix = makeSymmetric(matrix);
    matrix = fillAdjMatrixInf(matrix);
    // not yet run through floydWarshall, so A->C has no direct edge
    expect(graphDistance(graph, matrix, "A", "B")).toBe(1);
    expect(graphDistance(graph, matrix, "A", "C")).toBe(INF);
  });
});
