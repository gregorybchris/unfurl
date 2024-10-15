import { floydWarshall } from "./lib/algo";
import { INF } from "./lib/math";

export default function App() {
  const graph = [
    [0, 3, INF, 5],
    [2, 0, INF, 4],
    [INF, 1, 0, INF],
    [INF, INF, 2, 0],
  ];

  const shortestPaths = floydWarshall(graph);
  console.log("APSP: ", shortestPaths);

  return <h1 className="text-xl font-quicksand">Hello world!</h1>;
}
