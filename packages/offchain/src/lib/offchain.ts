import {
  BrowserWallet,
  Transaction,
  resolvePlutusScriptAddress,
  UTxO,
  readPlutusData,
  Asset,
  parseAssetUnit,
  readTransaction,
  resolveSlotNo,
} from '@meshsdk/core';
import type { PlutusScript } from '@meshsdk/core';

import { Blockfrost, Lucid } from 'lucid-cardano';

import { injectable, token } from '@mixer/injectable';
import { combineEff, withEff } from '@mixer/utils';
import { mkWalletModel } from '@mixer/wallet';
import {
  filter,
  first,
  forkJoin,
  from,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';

const koiosPreprodUrl = 'https://preprod.koios.rest/api/v0';

export const mkOffchain = injectable(
  token('depositScript')<string>(),
  token('tokenUnit')<string>(),
  mkWalletModel,
  combineEff((depositScriptCBorHash, tokenUnit, wallet) => {
    const script: PlutusScript = {
      code: depositScriptCBorHash,
      version: 'V2',
    };

    const lucid$ = from(
      Lucid.new(
        new Blockfrost(
          'https://cardano-preprod.blockfrost.io/api/v0',
          'preprodZpZ9X9GL1xL5vajWd8VNxHxcTyYoMePJ'
        ),
        'Preprod'
      )
    ).pipe(shareReplay(1));

    const scriptAddress = resolvePlutusScriptAddress(script, 0);

    const deposit = () => {
      const makeDeposit$ = (walletApi: BrowserWallet) =>
        forkJoin([
          lucid$,
          walletApi.getCollateral(),
          walletApi.getChangeAddress(),
        ]).pipe(
          switchMap(async ([lucid, collateral, address]) => {
            try {
              lucid.newTx().payToContract;

              // const unsignedTx = await tx.build();
              // const signedTx = await walletApi.signTx(unsignedTx, true);
              // const txHash = await koios.submitTx(signedTx);
            } catch (error) {
              console.log(error);
            }
          })
        );

      from(wallet.wallet$)
        .pipe(
          map((wallet) => wallet?.api),
          filter(
            (walletApi): walletApi is BrowserWallet => walletApi !== undefined
          ),
          first(),
          switchMap(makeDeposit$)
        )
        .subscribe();
    };

    function getUtxoByAsset(targetAsset: Asset, utxos: UTxO[]) {
      const { assetName: targetAssetName, policyId: targetPolicyId } =
        parseAssetUnit(targetAsset.unit);
      return utxos.find((utxo) =>
        utxo.output.amount.find((asset) => {
          const { assetName, policyId } = parseAssetUnit(asset.unit);
          return (
            targetAssetName === assetName &&
            targetPolicyId === policyId &&
            targetAsset.quantity === asset.quantity
          );
        })
      );
    }

    function addAmounts(amount: Asset[], assetToAdd: Asset): Asset[] {
      return amount.map((asset) =>
        asset.unit === assetToAdd.unit
          ? {
              unit: asset.unit,
              quantity: String(
                Number(asset.quantity) + Number(assetToAdd.quantity)
              ),
            }
          : asset
      );
    }

    return withEff({
      deposit,
    });
  })
);
