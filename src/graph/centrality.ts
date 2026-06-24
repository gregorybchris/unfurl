import { Graph } from './graph'

export function computeNodeDegrees(graph: Graph): number[] {
  const keys = Object.keys(graph)
  const degrees = keys.map((key) => graph[key].length)
  const max = Math.max(...degrees)
  return max === 0 ? degrees.map(() => 0) : degrees.map((d) => d / max)
}

export function computeEigenvectorCentrality(graph: Graph, iterations = 50): number[] {
  const keys = Object.keys(graph)
  const n = keys.length
  if (n === 0) return []

  const indexMap = new Map(keys.map((k, i) => [k, i]))

  // Build symmetric adjacency list
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) {
    for (const neighbor of graph[keys[i]]) {
      const j = indexMap.get(neighbor)
      if (j !== undefined) {
        adj[i].push(j)
        adj[j].push(i)
      }
    }
  }

  let v = new Array(n).fill(1.0)

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (const j of adj[i]) {
        next[i] += v[j]
      }
    }
    // L2 normalize
    let norm = 0
    for (let i = 0; i < n; i++) norm += next[i] * next[i]
    norm = Math.sqrt(norm)
    if (norm === 0) break
    for (let i = 0; i < n; i++) next[i] /= norm
    v = next
  }

  const max = Math.max(...v)
  return max === 0 ? v : v.map((x) => x / max)
}
