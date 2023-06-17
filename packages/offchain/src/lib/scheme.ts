import { Data } from 'lucid-cardano';

const MerkleTreeState = Data.Object({
  nextLeaf: Data.Integer(),
  tree: Data.Any(),
});

const DepositDatum = Data.Object({
  merkleTreeState: MerkleTreeState,
  merkleTreeRoot: Data.Nullable(Data.Integer()),
});

export const MixerDatum = Data.Enum([
  Data.Object({ DepositTree: Data.Object({ DepositDatum }) }),
  Data.Literal('Vault'),
]);

export const MixerRedeemer = Data.Enum([
  Data.Object({ Deposit: Data.Tuple([Data.Bytes()]) }),
  Data.Literal('Topup'),
  Data.Literal('Withdraw'),
]);

export type MixerRedeemer = Data.Static<typeof MixerRedeemer>;

export type MixerDatum = Data.Static<typeof MixerDatum>;
