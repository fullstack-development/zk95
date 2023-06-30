import { hashConcat, hash, toHex } from '@mixer/crypto';
import { fromHex } from '@mixer/crypto';

export type MerkleHash = Uint8Array;

export type MerkleProof = { nodes: Uint8Array[]; path: number[] };

interface MerkleTreeBase {
  leafs: MerkleHash[];
  root: MerkleHash;
  buildProof(leaf: MerkleHash | string): MerkleProof;
}

export interface UncompletedMerkleTree extends MerkleTreeBase {
  completed: false;
  insert(leaf: MerkleHash): MerkleTree;
}

export interface CompletedMerkleTree extends MerkleTreeBase {
  completed: true;
}

export type MerkleTree = UncompletedMerkleTree | CompletedMerkleTree;

type MerkleTreeConfig = {
  leafs: (MerkleHash | string)[];
  height: number;
  zeroValue?: string;
};

export function makeMerkleTree(config: MerkleTreeConfig): MerkleTree {
  const leafs = config.leafs.map(toMerkleHash);
  const zeroHash = hash(config.zeroValue ?? '');
  const completed = leafs.length >= 2 ** config.height;

  const merkleTreeBase: MerkleTreeBase = {
    leafs,
    get root(): Uint8Array {
      return hashLayers(
        leafs.length === 0 ? [zeroHash] : leafs,
        config.height,
        zeroHash
      )[0];
    },
    buildProof: (leaf) =>
      buildProof(leafs, [], [], toMerkleHash(leaf), config.height, zeroHash),
  };

  return completed
    ? {
        completed: true,
        ...merkleTreeBase,
      }
    : {
        completed: false,
        insert: (leaf) =>
          makeMerkleTree({
            leafs: leafs.concat(toMerkleHash(leaf)),
            height: config.height,
            zeroValue: config.zeroValue,
          }),
        ...merkleTreeBase,
      };
}

function buildProof(
  leafs: MerkleHash[],
  nodes: Uint8Array[],
  path: number[],
  leafToProof: MerkleHash,
  currentHeight: number,
  layerZeroHash: MerkleHash
): MerkleProof {
  const leafIdx = leafs.findIndex((leaf) => toHex(leaf) === toHex(leafToProof));
  if (
    currentHeight === 0 ||
    leafIdx === -1 ||
    toHex(leafToProof) === toHex(layerZeroHash)
  ) {
    return { nodes, path };
  }

  const pairIdx = Math.floor(leafIdx / 2);
  const pairs = pairwise(leafs, layerZeroHash);
  const nextLayer = pairs.map(hashPair);
  const oppositeIdx = leafIdx % 2 === 0 ? 1 : 0;
  const oppositeHash = pairs[pairIdx][oppositeIdx];
  return buildProof(
    nextLayer,
    [...nodes, oppositeHash],
    [...path, leafIdx % 2],
    nextLayer[pairIdx],
    currentHeight - 1,
    hashPair([layerZeroHash, layerZeroHash])
  );
}

function hashLayers(
  leafs: MerkleHash[],
  currentHeight: number,
  layerZeroHash: MerkleHash
): MerkleHash[] {
  return currentHeight === 0
    ? leafs
    : hashLayers(
        pairwise(leafs, layerZeroHash).map(hashPair),
        currentHeight - 1,
        hashPair([layerZeroHash, layerZeroHash])
      );
}

function hashPair(pair: [MerkleHash, MerkleHash]): MerkleHash {
  return hashConcat(...pair);
}

function pairwise<A>(list: A[], filler: A): [A, A][] {
  const result: [A, A][] = [];

  for (let idx = 0; idx < list.length; idx = idx + 2) {
    const left = list[idx];
    const right = list[idx + 1] ?? filler;
    result.push([left, right]);
  }

  return result;
}

function toMerkleHash(value: MerkleHash | string) {
  return typeof value === 'string' ? fromHex(value) : value;
}
