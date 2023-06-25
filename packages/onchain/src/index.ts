import { assert } from '@mixer/utils';
import { type Script, Data, Constr } from 'lucid-cardano';

export type PoolNominal = number;

export type MixerConfig = {
  zeroValue: string;
  depositScript: Script;
  withdrawScript: Script;
  vaultTokenUnit: string;
  depositTreeTokenUnit: string;
  nullifierStoreTokenUnit: string;
};

export type MerkleTree = {
  root: string;
  leafs: string[];
};

export type MixerDatum = { Tree: MerkleTree } | 'Vault';

export type MixerRedeemer = { Deposit: string } | 'Withdraw';

export function fromMerkleTree(merkleTree: MerkleTree): Data {
  return new Constr(0, [merkleTree.root, merkleTree.leafs]);
}

const is = <A>(
  value: unknown,
  pred: (...args: unknown[]) => boolean
): value is A => pred(value);

export function toMerkleTree(merkleTree: Data): MerkleTree {
  assert('Wrong tree structure', merkleTree instanceof Constr);
  assert(
    'Root is not ByteArray',
    is<string>(merkleTree.fields[0], (value) => typeof value === 'string')
  );
  assert(
    'Leaf is not a List',
    is<string[]>(merkleTree.fields[1], Array.isArray)
  );

  return {
    root: merkleTree.fields[0],
    leafs: merkleTree.fields[1],
  };
}

export function fromMixerDatum(datum: MixerDatum): Data {
  if (datum === 'Vault') {
    return new Constr(1, []);
  }

  return new Constr(0, [fromMerkleTree(datum.Tree)]);
}

export function toMixerDatum(datum: Data): MixerDatum {
  assert('Wrong mixer datum structure', datum instanceof Constr);

  if (datum.index === 1) {
    return 'Vault';
  }

  return { Tree: toMerkleTree(datum.fields[0]) };
}

export function fromMixerRedeemer(redeemer: MixerRedeemer): Data {
  if (redeemer === 'Withdraw') {
    return new Constr(1, []);
  }
  return new Constr(0, [redeemer.Deposit]);
}

export type OnchainConfig = Record<PoolNominal, MixerConfig>;
export const ONCHAIN_CONFIG_KEY = 'onchainConfig';
