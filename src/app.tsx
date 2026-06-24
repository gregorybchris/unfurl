import { useMemo, useRef, useState } from "react";
import { computeEigenvectorCentrality, computeNodeDegrees } from "@/graph/centrality";
import { floydWarshall } from "@/graph/algo";
import {
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
import lesMisData from "./data/les-miserables.json";
import karateData from "./data/karate.json";
import dolphinsData from "./data/dolphins.json";
import polbooksData from "./data/polbooks.json";
import adjnounData from "./data/adjnoun.json";
import footballData from "./data/football.json";

export const GRAPH_OPTIONS = [
  { id: "les-miserables", label: "Les Misérables", data: lesMisData as JsonGraph },
  { id: "karate", label: "Karate Club", data: karateData as JsonGraph },
  { id: "dolphins", label: "Dolphins", data: dolphinsData as JsonGraph },
  { id: "polbooks", label: "Political Books", data: polbooksData as JsonGraph },
  { id: "adjnoun", label: "Word Adjacency", data: adjnounData as JsonGraph },
  { id: "football", label: "College Football", data: footballData as JsonGraph },
] as const;

export type GraphId = (typeof GRAPH_OPTIONS)[number]["id"];

function computeGraphData(jsonGraph: JsonGraph) {
  const graph: Graph = jsonToGraph(jsonGraph);
  let matrix = graphToAdjMatrix(graph);
  matrix = makeSymmetric(matrix);
  matrix = fillAdjMatrixInf(matrix);
  const shortestPaths = floydWarshall(matrix);

  // Symmetrize adjacency list before computing centrality.
  const symGraph: Graph = {};
  for (const key of Object.keys(graph)) symGraph[key] = [...graph[key]];
  for (const [src, neighbors] of Object.entries(graph)) {
    for (const tgt of neighbors) {
      if (!symGraph[tgt].includes(src)) symGraph[tgt].push(src);
    }
  }

  return {
    shortestPaths,
    nodeDegrees: computeNodeDegrees(symGraph),
    eigenvectorCentrality: computeEigenvectorCentrality(symGraph),
  };
}

export default function App() {
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(defaultPhysicsConfig);
  const [selectedGraphId, setSelectedGraphId] = useState<GraphId>("les-miserables");
  const graphViewRef = useRef<GraphViewHandle>(null);

  const selectedGraph = GRAPH_OPTIONS.find((g) => g.id === selectedGraphId)!;
  const { shortestPaths, nodeDegrees, eigenvectorCentrality } = useMemo(
    () => computeGraphData(selectedGraph.data),
    [selectedGraphId], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
          selectedGraphId={selectedGraphId}
          onGraphChange={(id) => setSelectedGraphId(id as GraphId)}
        />
        <div className="flex-1 min-w-0">
          <GraphView
            key={selectedGraphId}
            ref={graphViewRef}
            graph={selectedGraph.data}
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
