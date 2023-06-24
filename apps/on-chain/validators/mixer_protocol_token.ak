use aiken/transaction.{OutputReference, ScriptContext}
use aiken/transaction/value.{AssetName}
use protocol_token/protocol_token.{mint_protocol_token}

validator(utxo_ref: OutputReference, token_name: AssetName) {
  fn mixer_minting_policy(_: Void, ctx: ScriptContext) {
    mint_protocol_token(utxo_ref, token_name, ctx)
  }
}
