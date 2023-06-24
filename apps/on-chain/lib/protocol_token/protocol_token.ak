use aiken/dict.{to_list}
use aiken/list.{any, find}
use aiken/transaction.{Mint,
  Output, OutputReference, ScriptContext, Transaction}
use aiken/transaction/value.{
  AssetName, PolicyId, from_minted_value, quantity_of, tokens,
}

pub fn mint_protocol_token(
  utxo_ref: OutputReference,
  token_name: AssetName,
  ctx: ScriptContext,
) {
  let ScriptContext { transaction, purpose } = ctx
  expect Mint(policy_id) = purpose
  let Transaction { inputs, mint, .. } = transaction
  expect [(asset_name, amount)] =
    mint
      |> from_minted_value
      |> tokens(policy_id)
      |> to_list()

  amount == 1 && asset_name == token_name && any(
    inputs,
    fn(input) { input.output_reference == utxo_ref },
  )
}

pub fn get_output_by(
  policy_id: PolicyId,
  token_name: AssetName,
  outputs: List<Output>,
) -> Option<Output> {
  outputs
    |> find(fn(output) { quantity_of(output.value, policy_id, token_name) == 1 })
}
