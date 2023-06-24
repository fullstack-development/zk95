import { fromHex, toHex, Script, combineHash } from 'lucid-cardano';

import * as cbor from 'https://deno.land/x/cbor@v1.4.1/index.js';

import blueprint from './plutus.json' assert { type: 'json' };

export function readValidator(
  name: 'mixer.mixer_validator' | 'mixer_protocol_token.mixer_minting_policy'
): Script {
  const validator = blueprint.validators.find(
    (validator) => validator.title === name
  );

  if (validator) {
    return {
      type: 'PlutusV2',
      script: toHex(cbor.encode(fromHex(validator.compiledCode))),
    };
  }

  throw new Error(`Validator with name: ${name} is not found`);
}

export function makeEmptyMerkleTree(
  height: number,
  layerHash: Uint8Array
): Uint8Array {
  return height === 0
    ? layerHash
    : makeEmptyMerkleTree(height - 1, combineHash(layerHash, layerHash));
}
