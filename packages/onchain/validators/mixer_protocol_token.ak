use aiken/transaction.{OutputReference, ScriptContext}
use aiken/transaction/value.{AssetName}
use protocol_token/protocol_token.{mint_protocol_token}

validator(utxo_ref: OutputReference) {
  fn mixer_minting_policy(token_names: List<AssetName>, ctx: ScriptContext) {
    mint_protocol_token(utxo_ref, token_names, ctx)
  }
}
