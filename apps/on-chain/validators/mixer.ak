use aiken/bytearray.{to_string}
use aiken/hash.{Hash, Sha3_256}
use aiken/list.{has}
use aiken/option.{is_some}
use aiken/transaction.{InlineDatum, ScriptContext, Spend} as tx
use aiken/transaction/value.{AssetName, PolicyId, from_lovelace, merge}
use merkle_tree/merkle_tree.{MerkleTree, MerkleTreeConfig, insert_leaf}
use protocol_token/protocol_token.{get_input_by, get_output_by}

type Commitment =
  Hash<Sha3_256, ByteArray>

type MixerConfig {
  policy_id: PolicyId,
  tree_token_name: AssetName,
  vault_token_name: AssetName,
  pool_nominal: Int,
  merkle_tree_config: MerkleTreeConfig,
}

type Datum {
  Tree(MerkleTree)
  Vault
}

type Redeemer {
  Deposit(Commitment)
  Withdraw
}

validator(config: MixerConfig) {
  fn mixer_validator(
    datum: Datum,
    redeemer: Redeemer,
    ctx: ScriptContext,
  ) -> Bool {
    when (datum, redeemer) is {
      (Tree(tree), Deposit(commitment)) ->
        validate_deposit(config, tree, commitment, ctx)
      (Vault, Deposit(_)) -> validate_topup(config, ctx)
      (Vault, Withdraw) -> error @"not implemented"
      _otherwise -> error @"Disallowed transition"
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
      config.policy_id,
      config.tree_token_name,
      ctx.transaction.outputs,
    )

  expect Some(vault_input) =
    get_input_by(
      config.policy_id,
      config.vault_token_name,
      ctx.transaction.inputs,
    )

  expect Some(vault_output) =
    get_output_by(
      config.policy_id,
      config.vault_token_name,
      ctx.transaction.outputs,
    )

  expect InlineDatum(datum) = tree_output.datum
  expect output_datum: Datum = datum
  expect Tree(output_tree) = output_datum

  let expected_out_value =
    from_lovelace(config.pool_nominal * 1000000)
      |> merge(vault_input.output.value)

  trace_if_false(
    "input tree value is not equal to output one",
    tree_input.output.value == tree_output.value,
  ) && trace_if_false(
    "commitment is already in the tree",
    !has(input_tree.leafs, commitment),
  ) && trace_if_false(
    "incorrect tree update",
    insert_leaf(input_tree, config.merkle_tree_config, commitment) == output_tree,
  ) && trace_if_false(
    "nominal not paid",
    expected_out_value == vault_output.value,
  )
}

fn validate_topup(config: MixerConfig, ctx: ScriptContext) -> Bool {
  let tree_input =
    get_input_by(
      config.policy_id,
      config.tree_token_name,
      ctx.transaction.inputs,
    )

  trace_if_false("tree utxo is not spent", is_some(tree_input))
}

fn trace_if_false(msg: ByteArray, predicate: Bool) -> Bool {
  when predicate is {
    True -> True
    False -> error to_string(msg)
  }
}
