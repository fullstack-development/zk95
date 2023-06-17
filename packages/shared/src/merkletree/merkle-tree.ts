import { sha256 } from 'hash.js';
import { fromHex, toHex } from 'lucid-cardano';

type Hasher = (value: string | ArrayBuffer) => Uint8Array;

export type MerkleLeaf = {
  hash: Uint8Array;
};

export type MerkleNode = {
  hash: Uint8Array;
  left: MerkleNode | MerkleLeaf;
  right: MerkleNode | MerkleLeaf;
};

type MerkleTreeBase = {
  readonly root: MerkleNode | MerkleLeaf;
  readonly leafsCount: number;
  readonly getLeafs: () => MerkleLeaf[];
  readonly isZeroLeaf: (leaf: MerkleLeaf) => boolean;
};

export type CompletedMerkleTree = MerkleTreeBase & {
  readonly completed: true;
};

export type UncompletedMerkleTree = MerkleTreeBase & {
  readonly completed: false;
  readonly addLeaf: (value: string, needHash?: boolean) => MerkleTree;
};

export type MerkleTree = CompletedMerkleTree | UncompletedMerkleTree;

type MakeMerkleTreeProps = {
  leafs: string[];
  depth?: number;
  hashKey?: 'SHA256';
  zeroValue?: string;
  needHash?: boolean;
};

export const hasher = (value: string | ArrayBuffer) =>
  Buffer.from(sha256().update(value).digest());

export function mkMerkleTree({
  leafs,
  depth,
  zeroValue = '',
  needHash = true,
}: MakeMerkleTreeProps): MerkleTree {
  const zeroHash = hasher(zeroValue);
  const hashedLeafs = leafs
    .map((leaf) => (needHash ? hasher(leaf) : fromHex(leaf)))
    .filter((leafHash) => toHex(leafHash) !== toHex(zeroHash));
  const levels = Math.max(
    depth ? Math.ceil(depth - 1) : Math.ceil(Math.log2(hashedLeafs.length)),
    0
  );
  const maxLeafsCount = getMaxLeafsCount(levels);
  const leafsLayer: MerkleLeaf[] = Array(maxLeafsCount)
    .fill(zeroHash)
    .map((zeroHash, idx) => ({ hash: hashedLeafs[idx] ?? zeroHash }));

  const root = create(levels, hasher, leafsLayer)[0];
  const completed = hashedLeafs.length >= maxLeafsCount;

  const merkleBase: MerkleTreeBase = {
    root,
    leafsCount: maxLeafsCount,
    getLeafs: () => leafsLayer,
    isZeroLeaf: (leaf) => toHex(leaf.hash) === toHex(zeroHash),
  };

  if (!completed) {
    const nextIdx = leafsLayer.findIndex(
      ({ hash }) => toHex(zeroHash) === toHex(hash)
    );
    const addLeaf = mkAddLeaf(root, nextIdx, levels, zeroHash, hasher);

    return {
      completed: false,
      ...merkleBase,
      addLeaf,
    };
  }

  return {
    completed: true,
    ...merkleBase,
  };
}

function mkAddLeaf(
  root: MerkleNode | MerkleLeaf,
  nextIdx: number,
  levels: number,
  zeroHash: Uint8Array,
  hasher: Hasher
): (value: string, needHash?: boolean) => MerkleTree {
  return (value: string, needHash = true) => {
    const traverse = (
      step: number,
      node: MerkleNode | MerkleLeaf
    ): MerkleNode | MerkleLeaf => {
      if (isNode(node)) {
        const direction = nextIdx & (2 ** step);
        const subtree = traverse(
          step - 1,
          node[direction === 0 ? 'left' : 'right']
        );

        const left = direction === 0 ? subtree : node.left;
        const right = direction === 0 ? node.right : subtree;

        return {
          hash: concatHashes(left.hash, right.hash),
          left,
          right,
        };
      }

      return {
        hash: needHash ? hasher(value) : fromHex(value),
      };
    };

    const newRoot = traverse(levels - 1, root);
    const maxLeafsCount = getMaxLeafsCount(levels);
    const newNextIdx = nextIdx + 1;
    const completed = newNextIdx === maxLeafsCount;

    const merkleBase: MerkleTreeBase = {
      root: newRoot,
      leafsCount: maxLeafsCount,
      isZeroLeaf: (leaf) => toHex(leaf.hash) === toHex(zeroHash),
      getLeafs: () =>
        reduceTree<MerkleLeaf[]>(
          (acc, node) => {
            if (!isNode(node)) {
              acc.push(node);
            }

            return acc;
          },
          newRoot,
          []
        ),
    };

    if (!completed) {
      const newNextIdx = nextIdx + 1;
      const addLeaf = mkAddLeaf(newRoot, newNextIdx, levels, zeroHash, hasher);

      return {
        completed: false,
        ...merkleBase,
        addLeaf,
      };
    }

    return {
      completed: true,
      ...merkleBase,
    };
  };
}

export function toHexTree(tree: MerkleTree) {
  type HexMerkleTree =
    | {
        hash: string;
      }
    | {
        hash: string;
        left: HexMerkleTree;
        right: HexMerkleTree;
      };
  return traverse(tree.root);

  function traverse(node: MerkleNode | MerkleLeaf): HexMerkleTree {
    if (isNode(node)) {
      return {
        hash: toHex(node.hash),
        left: traverse(node.left),
        right: traverse(node.right),
      };
    }

    return { hash: toHex(node.hash) };
  }
}

export function isNode(node: MerkleLeaf | MerkleNode): node is MerkleNode {
  return 'left' in node && 'right' in node;
}

export function concatHashes(hash1: Uint8Array, hash2: Uint8Array): Uint8Array {
  return hasher(Buffer.concat([hash1, hash2]));
}

function reduceTree<R>(
  fn: (acc: R, node: MerkleNode | MerkleLeaf) => R,
  node: MerkleNode | MerkleLeaf,
  initialValue: R
): R {
  if (isNode(node)) {
    const leftResult = reduceTree(fn, node.left, initialValue);
    const currentResult = fn(leftResult, node);
    const rightResult = reduceTree(fn, node.right, currentResult);

    return rightResult;
  }

  return fn(initialValue, node);
}

function create(
  level: number,
  hasher: Hasher,
  nodes: MerkleLeaf[] | MerkleNode[]
): MerkleNode[] | MerkleLeaf[] {
  if (level === 0) {
    return nodes as MerkleNode[];
  }

  const layer: MerkleNode[] = [];
  const maxLeafsCount = getMaxLeafsCount(level);

  for (let idx = 0; idx <= maxLeafsCount - 2; idx += 2) {
    const left = nodes[idx];
    const right = nodes[idx + 1];
    const hash = concatHashes(left.hash, right.hash);
    const newNode: MerkleNode = {
      hash,
      left,
      right,
    };
    layer.push(newNode);
  }

  return create(level - 1, hasher, layer);
}

function getMaxLeafsCount(level: number) {
  return 2 ** level;
}
