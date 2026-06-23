import { useRef, useState } from "react";
import { computeEigenvectorCentrality, computeNodeDegrees } from "@/graph/centrality";
import { floydWarshall } from "@/graph/algo";
import {
  AdjMatrix,
  fillAdjMatrixInf,
  Graph,
  graphToAdjMatrix,
  JsonGraph,
  jsonToGraph,
  makeSymmetric,
} from "@/graph/graph";
import { defaultPhysicsConfig, PhysicsConfig } from "@/simulation/physics-config";
import { ControlPanel } from "@/view/control-panel";
import { GraphView, GraphViewHandle } from "@/view/graph-view";
import data from "./data/les-miserables.json";

const jsonGraph: JsonGraph = data;
const graph: Graph = jsonToGraph(jsonGraph);

let matrix: AdjMatrix = graphToAdjMatrix(graph);
matrix = makeSymmetric(matrix);
matrix = fillAdjMatrixInf(matrix);
const shortestPaths = floydWarshall(matrix);

// Symmetrize the adjacency list before computing centrality so
// undirected degrees and eigenvector scores are correct.
const symGraph: Graph = {};
for (const key of Object.keys(graph)) symGraph[key] = [...graph[key]];
for (const [src, neighbors] of Object.entries(graph)) {
  for (const tgt of neighbors) {
    if (!symGraph[tgt].includes(src)) symGraph[tgt].push(src);
  }
}

const nodeDegrees = computeNodeDegrees(symGraph);
const eigenvectorCentrality = computeEigenvectorCentrality(symGraph);

export default function App() {
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(defaultPhysicsConfig);
  const graphViewRef = useRef<GraphViewHandle>(null);

  return (
    <div className="font-quicksand text-sea-green selection:bg-tree-green">
      <div className="flex h-screen w-screen">
        <ControlPanel
          config={physicsConfig}
          onChange={setPhysicsConfig}
          onAddHeat={() => graphViewRef.current?.addHeat()}
          onReset={() => {
            setPhysicsConfig(defaultPhysicsConfig);
            graphViewRef.current?.resetZoom();
          }}
          onZoomIn={() => graphViewRef.current?.zoomBy(1.2)}
          onZoomOut={() => graphViewRef.current?.zoomBy(1 / 1.2)}
        />
        <div className="flex-1 min-w-0">
          <GraphView
            ref={graphViewRef}
            graph={jsonGraph}
            seed={null}
            physicsConfig={physicsConfig}
            graphDistances={shortestPaths}
            nodeDegrees={nodeDegrees}
            eigenvectorCentrality={eigenvectorCentrality}
          />
        </div>
      </div>
    </div>
  );
}
