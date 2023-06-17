import { Constr, Data, toHex } from 'lucid-cardano';
import {
  MerkleLeaf,
  MerkleNode,
  MerkleTree,
  mkMerkleTree,
  isNode,
} from '@mixer/merkletree';

export const deserializeMerkleTree = (zeroValue: string, tree: Data) => {
  const [depth, leafs] = traverse(1, tree);

  return mkMerkleTree({
    leafs,
    zeroValue,
    depth,
    needHash: false,
  });

  function traverse(depth: number, tree: Data): [number, string[]] {
    if (
      tree instanceof Constr &&
      tree.index === 0 &&
      tree.fields.length === 0
    ) {
      return [depth, []];
    }

    if (
      tree instanceof Constr &&
      tree.index === 1 &&
      tree.fields.length === 3
    ) {
      const [nextDepth, left] = traverse(depth + 1, tree.fields[1]);
      const [, right] = traverse(depth + 1, tree.fields[2]);

      return [nextDepth, left.concat(right)];
    }

    if (
      tree instanceof Constr &&
      tree.index === 2 &&
      tree.fields.length === 1 &&
      typeof tree.fields[0] === 'string'
    ) {
      return [depth, tree.fields as string[]];
    }

    throw new Error('Wrong tree structure');
  }
};

export const serializeMerkleTree = (tree: MerkleTree): Data => {
  type DataTree = Constr<string | DataTree>;

  return traverse(tree.root);
  function traverse(node: MerkleNode | MerkleLeaf): DataTree {
    if (isNode(node)) {
      return new Constr(1, [
        toHex(node.hash),
        traverse(node.left),
        traverse(node.right),
      ]);
    }

    if (tree.isZeroLeaf(node)) {
      return new Constr(0, []);
    }

    return new Constr(2, [toHex(node.hash)]);
  }
};
