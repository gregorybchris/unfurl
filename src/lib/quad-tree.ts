import { Box, BoxImpl } from "./box";
import { Vector } from "./math";

interface Children {
  nw: Tree;
  ne: Tree;
  sw: Tree;
  se: Tree;
}

export interface Tree {
  size: number;
  capacity: number;
  box: Box;
  items: Vector[];
  children: Children | null;
}

export class TreeImpl {
  static new(box: Box, capacity: number): Tree {
    return {
      size: 0,
      capacity,
      box,
      items: [],
      children: null,
    };
  }

  // Insert an item into a quadtree, dividing if necessary.
  static insert(tree: Tree, item: Vector): Tree {
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
      tree = TreeImpl.divide(tree);
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
        nw: TreeImpl.insert(tree.children.nw, item),
        ne: TreeImpl.insert(tree.children.ne, item),
        sw: TreeImpl.insert(tree.children.sw, item),
        se: TreeImpl.insert(tree.children.se, item),
      },
    };
  }

  // Create four children, dividing a tree into four of equal area.
  static divide(tree: Tree): Tree {
    const capacity = tree.capacity;
    const x = tree.box.c.x;
    const y = tree.box.c.y;
    const hhs = tree.box.hs / 2;
    return {
      ...tree,
      children: {
        nw: TreeImpl.new({ c: { x: x - hhs, y: y + hhs }, hs: hhs }, capacity),
        ne: TreeImpl.new({ c: { x: x + hhs, y: y + hhs }, hs: hhs }, capacity),
        sw: TreeImpl.new({ c: { x: x - hhs, y: y - hhs }, hs: hhs }, capacity),
        se: TreeImpl.new({ c: { x: x + hhs, y: y - hhs }, hs: hhs }, capacity),
      },
    };
  }

  // Find all items contained within a given box.
  static query(tree: Tree, box: Box): Vector[] {
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

    Array.prototype.push.apply(items, TreeImpl.query(tree.children.nw, box));
    Array.prototype.push.apply(items, TreeImpl.query(tree.children.ne, box));
    Array.prototype.push.apply(items, TreeImpl.query(tree.children.sw, box));
    Array.prototype.push.apply(items, TreeImpl.query(tree.children.se, box));

    return items;
  }
}
