// deno-lint-ignore-file no-explicit-any
import {
  Data,
  applyDoubleCborEncoding,
  applyParamsToScript,
  fromText,
  sha256,
  toHex,
  type Script,
  type Address,
  type Lucid,
} from 'lucid-cardano';

import { readValidator } from './utils.ts';
import { MixerConfig } from './scheme.ts';

export function createMixerValidator(
  lucid: Lucid,
  policyId: string,
  tokenName: string,
  nominal: bigint,
  treeHeight: bigint,
  zeroValue: string
): { script: Script; address: Address } {
  const makeMixerValidator = readValidator('mixer.mixer_validator');

  const mixerConfig: MixerConfig = {
    protocolPolicyId: policyId,
    protocolTokenName: fromText(tokenName),
    poolNominal: nominal,
    merkleTreeConfig: {
      height: treeHeight,
      zeroHash: toHex(sha256(new TextEncoder().encode(zeroValue))),
    },
  };

  const mixerValidator = applyParamsToScript(makeMixerValidator.script, [
    Data.to<MixerConfig>(mixerConfig, MixerConfig as any),
  ]);

  const script: Script = {
    type: 'PlutusV2',
    script: applyDoubleCborEncoding(mixerValidator),
  };

  return {
    script,
    address: lucid.utils.validatorToAddress(script),
  };
}
