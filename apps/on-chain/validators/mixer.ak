use aiken/bytearray.{to_string}
use aiken/hash.{Hash, Sha3_256}
use aiken/list.{and, has}
use aiken/transaction.{InlineDatum, ScriptContext, Spend} as tx
use aiken/transaction/value.{AssetName, PolicyId, from_lovelace, merge}
use merkle_tree/merkle_tree.{MerkleTree, MerkleTreeConfig, insert_leaf}
use protocol_token/protocol_token.{get_output_by}

type Commitment =
  Hash<Sha3_256, ByteArray>

type MixerConfig {
  protocol_policy_id: PolicyId,
  protocol_token_name: AssetName,
  pool_nominal: Int,
  merkle_tree_config: MerkleTreeConfig,
}

type Datum {
  PoolTree(MerkleTree)
}

type Redeemer {
  Deposit(Commitment)
}

validator(config: MixerConfig) {
  fn mixer_validator(
    datum: Datum,
    redeemer: Redeemer,
    ctx: ScriptContext,
  ) -> Bool {
    when (datum, redeemer) is {
      (PoolTree(tree), Deposit(commitment)) ->
        validate_deposit(config, tree, commitment, ctx)
      _otherwise -> error @"Wrong transaction"
    }
  }
}

fn validate_deposit(
  config: MixerConfig,
  input_tree: MerkleTree,
  commitment: Commitment,
  ctx: ScriptContext,
) -> Bool {
  expect Spend(own_input_ref) = ctx.purpose
  expect Some(tree_input) =
    ctx.transaction.inputs |> tx.find_input(own_input_ref)
  expect Some(tree_output) =
    get_output_by(
      config.protocol_policy_id,
      config.protocol_token_name,
      ctx.transaction.outputs,
    )
  expect InlineDatum(out_data) = tree_output.datum
  expect out_datum: Datum = out_data
  let PoolTree(output_tree) = out_datum
  let expected_out_value =
    from_lovelace(config.pool_nominal * 1000000)
      |> merge(tree_input.output.value)

  [
    trace_if_false(
      "Commitment is already in the tree",
      !has(input_tree.leafs, commitment),
    ),
    trace_if_false("Incorrect value", expected_out_value == tree_output.value),
    trace_if_false(
      "Incorrect Merkle Tree insertion",
      insert_leaf(input_tree, config.merkle_tree_config, commitment) == output_tree,
    ),
  ]
    |> and
}

fn trace_if_false(msg: ByteArray, predicate: Bool) -> Bool {
  when predicate is {
    True -> True
    False -> error to_string(msg)
  }
}
