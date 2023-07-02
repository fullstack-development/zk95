use aiken/bytearray.{to_string}
use aiken/hash.{Blake2b_224, Hash, Sha3_256}
use aiken/list.{concat, has}
use aiken/option.{is_some}
use aiken/transaction.{InlineDatum, ScriptContext, Spend, Transaction} as tx
use aiken/transaction/credential.{VerificationKey}
use aiken/transaction/value.{AssetName, PolicyId, from_lovelace, merge, negate}
use merkle_tree/merkle_tree.{MerkleTree, MerkleTreeConfig, insert_leaf}
use protocol_token/protocol_token.{get_input_by, get_output_by}

type Commitment =
  Hash<Sha3_256, ByteArray>

type Nullifier =
  ByteArray

type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>

type MixerConfig {
  policy_id: PolicyId,
  tree_token_name: AssetName,
  vault_token_name: AssetName,
  nullifiers_token_name: AssetName,
  pool_nominal: Int,
  relayer_pkh: VerificationKeyHash,
  merkle_tree_config: MerkleTreeConfig,
}

type Datum {
  Tree(MerkleTree)
  Nullifiers(List<Nullifier>)
  Vault
}

type Redeemer {
  Deposit(Commitment)
  Withdraw(Nullifier)
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
      (Vault, _) -> validate_topup(config, redeemer, ctx)
      (Nullifiers(input_nullifiers), Withdraw(nullifier)) ->
        validate_withdraw(config, input_nullifiers, nullifier, ctx)
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

  trace to_string(config.vault_token_name)
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
    from_lovelace(config.pool_nominal)
      |> merge(vault_input.output.value)

  trace_if_false(
    "input tree value is not equal to output value",
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

fn validate_withdraw(
  config: MixerConfig,
  input_nullifiers: List<Nullifier>,
  nullifier: Nullifier,
  ctx: ScriptContext,
) -> Bool {
  expect Spend(own_input_ref) = ctx.purpose
  expect Some(nullifiers_input) =
    ctx.transaction.inputs |> tx.find_input(own_input_ref)
  expect Some(nullifiers_output) =
    get_output_by(
      config.policy_id,
      config.nullifiers_token_name,
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

  expect InlineDatum(datum) = nullifiers_output.datum
  expect output_datum: Datum = datum
  expect Nullifiers(output_nullifiers) = output_datum

  let expected_out_value =
    from_lovelace(config.pool_nominal)
      |> negate
      |> merge(vault_input.output.value)

  trace_if_false(
    "wrong signature",
    must_be_signed_by(ctx.transaction, config.relayer_pkh),
  ) && trace_if_false(
    "input value is not equal to output value",
    nullifiers_input.output.value == nullifiers_output.value,
  ) && trace_if_false("already withdrawn", !has(input_nullifiers, nullifier)) && trace_if_false(
    "nullifier was not added",
    concat(input_nullifiers, [nullifier]) == output_nullifiers,
  ) && trace_if_false(
    "deposit amout was not taken",
    expected_out_value == vault_output.value,
  )
}

fn validate_topup(
  config: MixerConfig,
  redeemer: Redeemer,
  ctx: ScriptContext,
) -> Bool {
  when redeemer is {
    Deposit(_) -> {
      let tree_input =
        get_input_by(
          config.policy_id,
          config.tree_token_name,
          ctx.transaction.inputs,
        )

      trace_if_false("tree utxo is not spent", is_some(tree_input))
    }
    Withdraw(_) -> {
      let nullifiers_input =
        get_input_by(
          config.policy_id,
          config.nullifiers_token_name,
          ctx.transaction.inputs,
        )

      trace_if_false("nullifiers utxo is not spent", is_some(nullifiers_input))
    }
  }
}

fn must_be_signed_by(transaction: Transaction, vk: VerificationKeyHash) {
  list.has(transaction.extra_signatories, vk)
}

fn trace_if_false(msg: ByteArray, predicate: Bool) -> Bool {
  when predicate is {
    True -> True
    False -> error to_string(msg)
  }
}
