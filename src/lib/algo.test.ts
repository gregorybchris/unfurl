import { describe, expect, it } from "vitest";
import { floydWarshall } from "./algo";
import { AdjMatrix } from "./graph";
import { INF } from "./math";

describe("floydWarshall", () => {
  it("computes all-pairs shortest paths through intermediate nodes", () => {
    // 0 -> 1 -> 2, no direct 0 -> 2 edge
    const matrix: AdjMatrix = [
      [0, 1, INF],
      [INF, 0, 1],
      [INF, INF, 0],
    ];

    expect(floydWarshall(matrix)).toEqual([
      [0, 1, 2],
      [INF, 0, 1],
      [INF, INF, 0],
    ]);
  });

  it("keeps already-optimal direct edges", () => {
    const matrix: AdjMatrix = [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ];
    expect(floydWarshall(matrix)).toEqual([
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ]);
  });

  it("does not mutate the input matrix", () => {
    const matrix: AdjMatrix = [
      [0, 1, INF],
      [INF, 0, 1],
      [INF, INF, 0],
    ];
    const snapshot = matrix.map((row) => [...row]);
    floydWarshall(matrix);
    expect(matrix).toEqual(snapshot);
  });

  it("handles a single-node graph", () => {
    expect(floydWarshall([[0]])).toEqual([[0]]);
  });
});
