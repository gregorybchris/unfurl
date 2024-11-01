import { Box, BoxImpl } from "./box";
import { Vector } from "./math";

interface Children {
  nw: QuadTree;
  ne: QuadTree;
  sw: QuadTree;
  se: QuadTree;
}

export interface QuadTree {
  size: number;
  capacity: number;
  box: Box;
  items: Vector[];
  children: Children | null;
}

export class QuadTreeImpl {
  static new(box: Box, capacity: number): QuadTree {
    return {
      size: 0,
      capacity,
      box,
      items: [],
      children: null,
    };
  }

  // Insert an item into a quadtree, dividing if necessary.
  static insert(tree: QuadTree, item: Vector): QuadTree {
    if (!BoxImpl.boxContains(tree.box, item)) {
      return tree;
    }

    if (tree.children === null && tree.items.length < tree.capacity) {
      return {
        ...tree,
        size: tree.size + 1,
        items: [...tree.items, item],
      };
    }

    if (tree.children === null) {
      tree = QuadTreeImpl.divide(tree);
    }

    if (tree.children === null) {
      // This should never happen
      console.error("Divide failed");
      return tree;
    }

    return {
      ...tree,
      size: tree.size + 1,
      children: {
        nw: QuadTreeImpl.insert(tree.children.nw, item),
        ne: QuadTreeImpl.insert(tree.children.ne, item),
        sw: QuadTreeImpl.insert(tree.children.sw, item),
        se: QuadTreeImpl.insert(tree.children.se, item),
      },
    };
  }

  // Create four children, dividing a tree into four of equal area.
  static divide(tree: QuadTree): QuadTree {
    const capacity = tree.capacity;
    const x = tree.box.c.x;
    const y = tree.box.c.y;
    const hhs = tree.box.hs / 2;
    return {
      ...tree,
      children: {
        nw: QuadTreeImpl.new({ c: { x: x - hhs, y: y + hhs }, hs: hhs }, capacity),
        ne: QuadTreeImpl.new({ c: { x: x + hhs, y: y + hhs }, hs: hhs }, capacity),
        sw: QuadTreeImpl.new({ c: { x: x - hhs, y: y - hhs }, hs: hhs }, capacity),
        se: QuadTreeImpl.new({ c: { x: x + hhs, y: y - hhs }, hs: hhs }, capacity),
      },
    };
  }

  // Find all items contained within a given box.
  static query(tree: QuadTree, box: Box): Vector[] {
    if (!BoxImpl.boxIntersects(tree.box, box)) {
      return [];
    }

    const items: Vector[] = [];
    for (let i = 0; i < tree.items.length; i++) {
      if (BoxImpl.boxContains(box, tree.items[i])) {
        items.push(tree.items[i]);
      }
    }

    if (tree.children === null) {
      return items;
    }

    Array.prototype.push.apply(items, QuadTreeImpl.query(tree.children.nw, box));
    Array.prototype.push.apply(items, QuadTreeImpl.query(tree.children.ne, box));
    Array.prototype.push.apply(items, QuadTreeImpl.query(tree.children.sw, box));
    Array.prototype.push.apply(items, QuadTreeImpl.query(tree.children.se, box));

    return items;
  }
}
