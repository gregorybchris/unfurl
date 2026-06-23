import { describe, expect, it } from "vitest";
import { QuadBox } from "./quad-box";
import { Item, QuadTreeImpl } from "./quad-tree";

const rootBox: QuadBox = { center: { x: 0, y: 0 }, halfSize: 10 };

function item(id: string, x: number, y: number): Item {
  return { id, position: { x, y } };
}

describe("QuadTreeImpl", () => {
  describe("new", () => {
    it("creates an empty leaf", () => {
      const tree = QuadTreeImpl.new(rootBox, 4);
      expect(tree.size).toBe(0);
      expect(tree.items).toEqual([]);
      expect(tree.children).toBeNull();
      expect(tree.cellCapacity).toBe(4);
    });
  });

  describe("insert", () => {
    it("ignores items outside the box", () => {
      const tree = QuadTreeImpl.new(rootBox, 4);
      const result = QuadTreeImpl.insert(tree, item("far", 100, 100));
      expect(result.size).toBe(0);
      expect(result.items).toEqual([]);
    });

    it("stores items in the leaf until capacity is reached", () => {
      let tree = QuadTreeImpl.new(rootBox, 2);
      tree = QuadTreeImpl.insert(tree, item("a", 1, 1));
      tree = QuadTreeImpl.insert(tree, item("b", 2, 2));
      expect(tree.size).toBe(2);
      expect(tree.children).toBeNull();
      expect(tree.items.map((i) => i.id)).toEqual(["a", "b"]);
    });

    it("subdivides once capacity is exceeded", () => {
      let tree = QuadTreeImpl.new(rootBox, 2);
      tree = QuadTreeImpl.insert(tree, item("a", 1, 1));
      tree = QuadTreeImpl.insert(tree, item("b", 2, 2));
      tree = QuadTreeImpl.insert(tree, item("c", 3, 3));
      expect(tree.size).toBe(3);
      expect(tree.children).not.toBeNull();
      // the overflow item lands in the north-east quadrant
      expect(tree.children?.ne.items.map((i) => i.id)).toEqual(["c"]);
    });

    it("treats inserts as immutable (returns a new tree)", () => {
      const tree = QuadTreeImpl.new(rootBox, 2);
      const next = QuadTreeImpl.insert(tree, item("a", 1, 1));
      expect(tree.size).toBe(0);
      expect(next.size).toBe(1);
      expect(next).not.toBe(tree);
    });
  });

  describe("divide", () => {
    it("creates four equally-sized child quadrants", () => {
      const tree = QuadTreeImpl.divide(QuadTreeImpl.new(rootBox, 4));
      const children = tree.children!;
      expect(children.nw.box).toEqual({ center: { x: -5, y: 5 }, halfSize: 5 });
      expect(children.ne.box).toEqual({ center: { x: 5, y: 5 }, halfSize: 5 });
      expect(children.sw.box).toEqual({ center: { x: -5, y: -5 }, halfSize: 5 });
      expect(children.se.box).toEqual({ center: { x: 5, y: -5 }, halfSize: 5 });
    });
  });

  describe("query", () => {
    it("returns every item within a covering box", () => {
      let tree = QuadTreeImpl.new(rootBox, 2);
      tree = QuadTreeImpl.insert(tree, item("a", 1, 1));
      tree = QuadTreeImpl.insert(tree, item("b", 2, 2));
      tree = QuadTreeImpl.insert(tree, item("c", 3, 3));

      const found = QuadTreeImpl.query(tree, rootBox).map((i) => i.id).sort();
      expect(found).toEqual(["a", "b", "c"]);
    });

    it("returns only items inside the query box", () => {
      let tree = QuadTreeImpl.new(rootBox, 2);
      tree = QuadTreeImpl.insert(tree, item("a", 1, 1));
      tree = QuadTreeImpl.insert(tree, item("b", 2, 2));
      tree = QuadTreeImpl.insert(tree, item("c", 3, 3));

      const found = QuadTreeImpl.query(tree, { center: { x: 3, y: 3 }, halfSize: 1 });
      expect(found.map((i) => i.id)).toEqual(["c"]);
    });

    it("returns nothing for a non-intersecting box", () => {
      let tree = QuadTreeImpl.new(rootBox, 2);
      tree = QuadTreeImpl.insert(tree, item("a", 1, 1));
      expect(QuadTreeImpl.query(tree, { center: { x: 100, y: 100 }, halfSize: 1 })).toEqual([]);
    });
  });
});
