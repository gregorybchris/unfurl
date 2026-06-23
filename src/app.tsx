import { floydWarshall } from "@/graph/algo";
import {
  AdjMatrix,
  fillAdjMatrixInf,
  Graph,
  graphDistance,
  graphToAdjMatrix,
  JsonGraph,
  jsonToGraph,
  makeSymmetric,
} from "@/graph/graph";
import { GraphView } from "@/view/graph-view";
import data from "./data/les-miserables.json";

export default function App() {
  const jsonGraph: JsonGraph = data;

  const graph: Graph = jsonToGraph(jsonGraph);
  console.log("Graph: ", graph);

  let matrix: AdjMatrix = graphToAdjMatrix(graph);
  matrix = makeSymmetric(matrix);
  matrix = fillAdjMatrixInf(matrix);
  console.log("Adjacency Matrix: ", matrix);

  const shortestPaths = floydWarshall(matrix);
  console.log("APSP: ", shortestPaths);

  console.log("Distance between Valjean and Myriel: ", graphDistance(graph, shortestPaths, "Valjean", "Myriel"));
  console.log("Distance between Cosette and Gueulemer: ", graphDistance(graph, shortestPaths, "Cosette", "Gueulemer"));

  return (
    <div className="font-quicksand text-sea-green selection:bg-tree-green">
      <div className="h-screen w-screen">
        <GraphView graph={graph} seed={null} />
      </div>
    </div>
  );
}
