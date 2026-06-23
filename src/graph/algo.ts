import { AdjMatrix } from "./graph";
import { INF } from "@/math/math";

/// Floyd Warshall Algorithm
/// All pairs shortest paths
export function floydWarshall(matrix: AdjMatrix): AdjMatrix {
  const numNodes = matrix.length;
  const dist: AdjMatrix = Array.from({ length: numNodes }, (_, i) => [...matrix[i]]);

  // Iterate through each possible intermediate node
  for (let k = 0; k < numNodes; k++) {
    // Iterate through all pairs of nodes (i, j)
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        // If going through node k offers a shorter path, update dist[i][j]
        if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}
