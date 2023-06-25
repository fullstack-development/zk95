import { fromHex, toHex, Script, combineHash, sha256 } from 'lucid-cardano';

import * as cbor from 'https://deno.land/x/cbor@v1.4.1/index.js';

import blueprint from '../../on-chain/plutus.json' assert { type: 'json' };

export function readValidator(
  name: 'mixer.mixer_validator' | 'mixer_protocol_token.mixer_minting_policy'
): Script {
  const validator = blueprint.validators.find(
    (validator) => validator.title === name
  );

  if (validator) {
    return {
      type: 'PlutusV2',
      script: toHex(cbor.encode(fromHex(validator.compiledCode))),
    };
  }

  throw new Error(`Validator with name: ${name} is not found`);
}

export function assert(msg: string, condition: unknown): asserts condition {
  if (!condition) throw new Error(msg);
}

export type MerkleHash = Uint8Array;

export interface UncompletedMerkleTree {
  completed: false;
  leafs: MerkleHash[];
  root: MerkleHash;
  insert(leaf: MerkleHash): CompletedMerkleTree | UncompletedMerkleTree;
}

export interface CompletedMerkleTree {
  completed: true;
  leafs: MerkleHash[];
  root: MerkleHash;
}

type MerkleTreeConfig = {
  leafs: (MerkleHash | string)[];
  height: number;
  zeroValue: string;
};

export class MerkleTree {
  public completed: boolean;
  private _leafs: MerkleHash[];
  private _height: number;
  private _zeroValue: string;

  static make({
    leafs,
    height,
    zeroValue,
  }: MerkleTreeConfig): UncompletedMerkleTree | CompletedMerkleTree {
    return new MerkleTree(
      leafs.map(MerkleTree.toMerkleHash),
      height,
      zeroValue,
      leafs.length >= 2 ** height
    );
  }

  private constructor(
    leafs: MerkleHash[],
    height: number,
    zeroValue: string,
    completed: boolean
  ) {
    this._leafs = leafs;
    this._height = height;
    this._zeroValue = zeroValue;
    this.completed = completed;
  }

  get leafs() {
    return this._leafs;
  }

  get root() {
    const zeroHash = sha256(new TextEncoder().encode(this._zeroValue));
    return hashLayers(
      this._leafs.length === 0 ? [zeroHash] : this._leafs,
      this._height,
      zeroHash
    )[0];
  }

  public insert(leaf: MerkleHash | string) {
    return MerkleTree.make({
      leafs: this._leafs.concat(MerkleTree.toMerkleHash(leaf)),
      height: this._height,
      zeroValue: this._zeroValue,
    });
  }

  static toMerkleHash = (value: Uint8Array | string) =>
    typeof value === 'string' ? fromHex(value) : value;
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

function hashPair([left, right]: [MerkleHash, MerkleHash]): MerkleHash {
  return combineHash(left, right);
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
