import { Vector } from "./math";
import { QuadBox, QuadBoxImpl } from "./quad-box";

export interface Item {
  id: string;
  position: Vector;
}

type Children = {
  nw: QuadTree;
  ne: QuadTree;
  sw: QuadTree;
  se: QuadTree;
};

export type QuadTree = {
  size: number;
  cellCapacity: number;
  box: QuadBox;
  items: Item[];
  children: Children | null;
};

export class QuadTreeImpl {
  static new(box: QuadBox, cellCapacity: number): QuadTree {
    return {
      size: 0,
      cellCapacity,
      box,
      items: [],
      children: null,
    };
  }

  // Insert an item into a quadtree, dividing if necessary.
  static insert(tree: QuadTree, item: Item): QuadTree {
    if (!QuadBoxImpl.boxContains(tree.box, item.position)) {
      return tree;
    }

    if (tree.children === null && tree.items.length < tree.cellCapacity) {
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
    const capacity = tree.cellCapacity;
    const x = tree.box.center.x;
    const y = tree.box.center.y;
    const hhs = tree.box.halfSize / 2;
    return {
      ...tree,
      children: {
        nw: QuadTreeImpl.new({ center: { x: x - hhs, y: y + hhs }, halfSize: hhs }, capacity),
        ne: QuadTreeImpl.new({ center: { x: x + hhs, y: y + hhs }, halfSize: hhs }, capacity),
        sw: QuadTreeImpl.new({ center: { x: x - hhs, y: y - hhs }, halfSize: hhs }, capacity),
        se: QuadTreeImpl.new({ center: { x: x + hhs, y: y - hhs }, halfSize: hhs }, capacity),
      },
    };
  }

  // Find all items contained within a given box.
  static query(tree: QuadTree, box: QuadBox): Item[] {
    if (!QuadBoxImpl.boxIntersects(tree.box, box)) {
      return [];
    }

    const items: Item[] = [];
    for (let i = 0; i < tree.items.length; i++) {
      if (QuadBoxImpl.boxContains(box, tree.items[i].position)) {
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
