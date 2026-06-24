import { INF } from '@/math/math'

export type AdjMatrix = number[][]

export type Graph = {
  [key: string]: string[]
}

export type Node = {
  id: string
  group: number
}

export type Link = {
  source: string
  target: string
  value: number
}

export type JsonGraph = {
  nodes: Node[]
  links: Link[]
}

export function jsonToGraph(jsonGraph: JsonGraph): Graph {
  const graph: Graph = {}

  jsonGraph.nodes.forEach((node) => {
    graph[node.id] = []
  })

  jsonGraph.links.forEach((link) => {
    graph[link.source].push(link.target)
  })

  return graph
}

export function graphToAdjMatrix(graph: Graph): AdjMatrix {
  const numNodes = Object.keys(graph).length
  const adjMatrix: AdjMatrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0))

  Object.keys(graph).forEach((node, i) => {
    graph[node].forEach((neighbor) => {
      const j = Object.keys(graph).indexOf(neighbor)
      adjMatrix[i][j] = 1
    })
  })

  return adjMatrix
}

export function makeSymmetric(matrix: AdjMatrix): AdjMatrix {
  const numNodes = matrix.length

  for (let i = 0; i < numNodes; i++) {
    for (let j = 0; j < numNodes; j++) {
      if (matrix[i][j] === 1) {
        matrix[j][i] = 1
      }
    }
  }

  return matrix
}

export function fillAdjMatrixInf(matrix: AdjMatrix): AdjMatrix {
  return matrix.map((row) => row.map((cell) => (cell === 0 ? INF : cell)))
}

export function getNodeIndex(graph: Graph, node: string): number {
  return Object.keys(graph).indexOf(node)
}

export function graphDistance(
  graph: Graph,
  matrix: AdjMatrix,
  source: string,
  target: string
): number {
  const sourceIndex = getNodeIndex(graph, source)
  const targetIndex = getNodeIndex(graph, target)
  return matrix[sourceIndex][targetIndex]
}
