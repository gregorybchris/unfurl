import { INF } from "./math";

/// Floyd Warshall Algorithm
/// All pairs shortest paths
export function floydWarshall(graph: number[][]): number[][] {
  const numVertices = graph.length;
  const dist: number[][] = Array.from({ length: numVertices }, (_, i) => [...graph[i]]);

  // Iterate through each possible intermediate vertex
  for (let k = 0; k < numVertices; k++) {
    // Iterate through all pairs of vertices (i, j)
    for (let i = 0; i < numVertices; i++) {
      for (let j = 0; j < numVertices; j++) {
        // If going through vertex k offers a shorter path, update dist[i][j]
        if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}
