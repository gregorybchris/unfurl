import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { Graph } from "./lib/graph";
import { Publisher, Subscriber } from "./lib/pubsub";

interface GraphViewProps {
  graph: Graph;
}

type Point = {
  id: string;
  x: number;
  y: number;
  r: number;
  fill: string;
  publisher: Publisher<Point>;
};

export function GraphView({ graph }: GraphViewProps) {
  const [WIDTH, HEIGHT] = [500, 500];
  const d3Container = useRef(null);
  const initialized = useRef(false);

  const point = {
    id: "point-1",
    x: 400,
    y: 200,
    r: 8,
    fill: "#5FC193",
    publisher: new Publisher<Point>(),
  };
  const points: Point[] = [point];

  useEffect(() => {
    function onUpdate(_: number, deltaTime: number) {
      const speed = 0.2;
      points.forEach((point: Point) => {
        point.x += (Math.random() - 0.5) * speed * deltaTime;
        point.y += (Math.random() - 0.5) * speed * deltaTime;
        point.publisher.publish(point);
      });
    }
    if (d3Container.current && !initialized.current) {
      initGraphics(points, onUpdate);
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUpdate = (onUpdate: (currentTime: number, deltaTime: number) => void) => {
    let lastTime = 0;
    const update = (currentTime?: number) => {
      currentTime = currentTime || 0;
      const deltaTime = currentTime - (lastTime || 0);
      lastTime = currentTime;
      onUpdate(currentTime, deltaTime);
      requestAnimationFrame(update);
    };
    return update;
  };

  const onPointMove = (point: Point) => {
    d3.select(`#point-${point.id}`).attr("cx", point.x).attr("cy", point.y);
  };

  const initGraphics = (points: Point[], onUpdate: (currentTime: number, deltaTime: number) => void) => {
    const canvas = d3
      .select(d3Container.current)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

    const pointsGroup = canvas.append("g").attr("id", "points-group");
    const pointCircles = pointsGroup
      .selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (point) => point.x)
      .attr("cy", (point) => point.y)
      .attr("r", (point) => point.r)
      .attr("fill", (point) => point.fill)
      .attr("id", (point) => `point-${point.id}`)
      .on("click", (_, point) => {
        console.log("Clicked point", point.id);
      });
    pointCircles.append("title").text((point) => `point ${point.id}`);

    points.forEach((point: Point) => {
      const subscriber = new Subscriber<Point>(onPointMove);
      subscriber.subscribe(point.publisher);
    });

    const updateFunc = getUpdate(onUpdate);
    updateFunc();
  };

  return (
    <div>
      <svg ref={d3Container} className="h-[300px] w-[500px] border border-sea-green" />
    </div>
  );
}
