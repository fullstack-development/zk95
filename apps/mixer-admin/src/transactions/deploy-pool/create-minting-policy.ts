import {
  Constr,
  Lucid,
  applyDoubleCborEncoding,
  applyParamsToScript,
  type Script,
} from 'lucid-cardano';

import { readValidator } from '../../utils.ts';

export async function createMintingPolicy(
  lucid: Lucid
): Promise<{ script: Script; policyId: string }> {
  const makeMintingPolicy = readValidator(
    'mixer_protocol_token.mixer_minting_policy'
  );
  const userWalletUtxos = await lucid.wallet.getUtxos();

  const outRef = new Constr(0, [
    new Constr(0, [userWalletUtxos[0].txHash]),
    BigInt(userWalletUtxos[0].outputIndex),
  ]);

  const mintingPolicy = applyParamsToScript(makeMintingPolicy.script, [outRef]);

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
  };
}
