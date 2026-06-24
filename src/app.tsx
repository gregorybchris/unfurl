import { useEffect, useMemo, useRef, useState } from "react";
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
import { decodeSettings, encodeSettings } from "@/settings-codec";
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

export type Theme = "slate-dark" | "warm-charcoal" | "parchment" | "deep-navy" | "true-gray";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "slate-dark", label: "Slate Dark", swatch: "#818cf8" },
  { id: "warm-charcoal", label: "Warm Charcoal", swatch: "#fbbf24" },
  { id: "parchment", label: "Parchment", swatch: "#4f46e5" },
  { id: "deep-navy", label: "Deep Navy", swatch: "#22d3ee" },
  { id: "true-gray", label: "True Gray", swatch: "#a3a3a3" },
];

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

const INITIAL_URL_SETTINGS = (() => {
  const c = new URLSearchParams(window.location.search).get("c");
  return c ? decodeSettings(c) : null;
})();

export default function App() {
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(
    INITIAL_URL_SETTINGS?.physicsConfig ?? defaultPhysicsConfig
  );
  const [selectedGraphId, setSelectedGraphId] = useState<GraphId>(
    INITIAL_URL_SETTINGS?.selectedGraphId ?? "les-miserables"
  );
  const [theme, setTheme] = useState<Theme>(INITIAL_URL_SETTINGS?.theme ?? "slate-dark");
  const [nodeColors, setNodeColors] = useState(INITIAL_URL_SETTINGS?.nodeColors ?? false);
  const graphViewRef = useRef<GraphViewHandle>(null);

  useEffect(() => {
    const encoded = encodeSettings({ physicsConfig, selectedGraphId, theme, nodeColors });
    const url = new URL(window.location.href);
    url.searchParams.set("c", encoded);
    window.history.replaceState(null, "", url.toString());
  }, [physicsConfig, selectedGraphId, theme, nodeColors]);

  const selectedGraph = GRAPH_OPTIONS.find((g) => g.id === selectedGraphId)!;
  const { shortestPaths, nodeDegrees, eigenvectorCentrality } = useMemo(
    () => computeGraphData(selectedGraph.data),
    [selectedGraphId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div
      data-theme={theme}
      className="font-quicksand text-accent selection:bg-surface bg-body"
    >
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
          theme={theme}
          onThemeChange={setTheme}
          nodeColors={nodeColors}
          onNodeColorsChange={setNodeColors}
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
            nodeColors={nodeColors}
          />
        </div>
      </div>
    </div>
  );
}
