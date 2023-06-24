import {
  Constr,
  Lucid,
  applyDoubleCborEncoding,
  applyParamsToScript,
  fromText,
  type Script,
} from 'lucid-cardano';

import { readValidator } from './utils.ts';

export async function createMintingPolicy(
  lucid: Lucid,
  tokenName: string
): Promise<{ script: Script; policyId: string; tokenName: string }> {
  const makeMintingPolicy = readValidator(
    'mixer_protocol_token.mixer_minting_policy'
  );
  const userWalletUtxos = await lucid.wallet.getUtxos();

  const outRef = new Constr(0, [
    new Constr(0, [userWalletUtxos[0].txHash]),
    BigInt(userWalletUtxos[0].outputIndex),
  ]);

  const mintingPolicy = applyParamsToScript(makeMintingPolicy.script, [
    outRef,
    fromText(tokenName),
  ]);

  const policyId = lucid.utils.validatorToScriptHash({
    type: 'PlutusV2',
    script: mintingPolicy,
  });

  return {
    script: {
      type: 'PlutusV2',
      script: applyDoubleCborEncoding(mintingPolicy),
    },
    policyId,
    tokenName: fromText(tokenName),
  };
}
