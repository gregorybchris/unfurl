import data from "./data/les-miserables.json";
import { floydWarshall } from "./lib/algo";
import {
  AdjMatrix,
  fillAdjMatrixInf,
  Graph,
  graphDistance,
  graphToAdjMatrix,
  JsonGraph,
  jsonToGraph,
  makeSymmetric,
} from "./lib/graph";

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
    <div className="font-quicksand">
      <div className="flex flex-col text-xl justify-center h-screen w-screen">
        <div className="text-center">Welcome to Unfurl</div>
      </div>
    </div>
  );
}
