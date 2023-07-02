import { Emulator, fromUnit, toText, type Script, Data } from 'lucid-cardano';

import blueprint from '@mixer/onchain' assert { type: 'json' };
import { MixerDatum } from './scheme';

export function readValidator(
  name: (typeof blueprint)['validators'][number]['title']
): Script {
  const validator = blueprint.validators.find(
    (validator) => validator.title === name
  );

  if (validator) {
    return {
      type: 'PlutusV2',
      script: validator.compiledCode,
    };
  }

  throw new Error(`Validator with name: ${name} is not found`);
}

export function printLedger(ledger: Emulator['ledger']) {
  return Object.keys(ledger).reduce((newLedger, txHash) => {
    const { address, assets, datum, datumHash, scriptRef, outputIndex } =
      ledger[txHash].utxo;

    const newAssets = Object.keys(assets).reduce((newAssets, unit) => {
      const assetDetails = fromUnit(unit);

      newAssets[assetDetails.policyId] = {
        tokenName: assetDetails.name ? toText(assetDetails.name) : null,
        quantity: assets[unit],
      };

      return newAssets;
    }, {} as any);

    const parsedDatum = datum
      ? (() => {
          try {
            return Data.from(datum, MixerDatum as never);
          } catch (error) {
            return datum;
          }
        })()
      : undefined;

    newLedger[txHash] = {
      address,
      assets: newAssets,
      datum: parsedDatum,
      datumHash,
      hasScriptRef: Boolean(scriptRef),
      outputIndex,
    };

    return newLedger;
  }, {} as any);
}
