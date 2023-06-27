use aiken/dict.{to_list}
use aiken/list.{all, any, find, has}
use aiken/transaction.{
  Input, Mint, Output, OutputReference, ScriptContext, Transaction,
}
use aiken/transaction/value.{
  AssetName, PolicyId, from_minted_value, quantity_of, tokens,
}

pub fn mint_protocol_token(
  utxo_ref: OutputReference,
  token_names: List<AssetName>,
  ctx: ScriptContext,
) {
  let ScriptContext { transaction, purpose } = ctx
  expect Mint(policy_id) = purpose
  let Transaction { inputs, mint, .. } = transaction
  let minted_tokens =
    mint
      |> from_minted_value
      |> tokens(policy_id)
      |> to_list()

  let is_utxo_ref_consumed =
    any(inputs, fn(input) { input.output_reference == utxo_ref })

  let are_minted_tokens_valid =
    all(
      minted_tokens,
      fn(pair) {
        let (token_name, quantity) = pair
        has(token_names, token_name) && quantity == 1
      },
    )

  are_minted_tokens_valid && is_utxo_ref_consumed
}

pub fn get_output_by(
  policy_id: PolicyId,
  token_name: AssetName,
  outputs: List<Output>,
) -> Option<Output> {
  outputs
    |> find(fn(output) { quantity_of(output.value, policy_id, token_name) == 1 })
}

pub fn get_input_by(
  policy_id: PolicyId,
  token_name: AssetName,
  inputs: List<Input>,
) -> Option<Input> {
  inputs
    |> find(
         fn(input) {
           quantity_of(input.output.value, policy_id, token_name) == 1
         },
       )
}
