import {
  BrowserWallet,
  KoiosProvider,
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

import { injectable, token } from '@mixer/injectable';
import { bindModule, mkModule } from '@mixer/utils';
import { mkWalletModel } from '@mixer/wallet';
import { filter, first, forkJoin, from, map, switchMap } from 'rxjs';

export const mkOffchain = injectable(
  token('depositScript')<string>(),
  token('tokenUnit')<string>(),
  mkWalletModel,
  bindModule((depositScriptCBorHash, tokenUnit, wallet) => {
    const koios = new KoiosProvider('preprod');
    const script: PlutusScript = {
      code: depositScriptCBorHash,
      version: 'V2',
    };

    const scriptAddress = resolvePlutusScriptAddress(script, 0);

    const deposit = () => {
      const makeDeposit$ = (walletApi: BrowserWallet) =>
        forkJoin([
          koios.fetchAddressUTxOs(scriptAddress),
          walletApi.getCollateral(),
          walletApi.getChangeAddress(),
        ]).pipe(
          switchMap(async ([scriptUtxos, collateral, address]) => {
            const minutes = 15;
            const nowDateTime = new Date();
            const dateTimeAdd5Min = new Date(
              nowDateTime.getTime() + minutes * 60000
            );
            const slot = resolveSlotNo('preprod', dateTimeAdd5Min.getTime());
            const scriptUtxo = getUtxoByAsset(
              { quantity: '1', unit: tokenUnit },
              scriptUtxos
            );
            if (scriptUtxo) {
              try {
                const datum = readPlutusData(
                  scriptUtxo.output.plutusData ?? ''
                );
                const redeemer = {
                  data: { alternative: 0, fields: [] },
                };
                console.log(scriptUtxos);

                const tx = new Transaction({
                  initiator: walletApi,
                }).redeemValue({
                  value: scriptUtxo,
                  script,
                  datum: scriptUtxo,
                  redeemer,
                });
                // .sendValue(
                //   {
                //     address: scriptAddress,
                //     datum: {
                //       value: datum,
                //       inline: true,
                //     },
                //     script,
                //   },
                //   {
                //     input: scriptUtxo.input,
                //     output: {
                //       ...scriptUtxo.output,
                //       amount: addAmounts(scriptUtxo.output.amount, {
                //         unit: 'lovelace',
                //         quantity: '100000000',
                //       }),
                //     },
                //   } as UTxO
                // )
                // .setCollateral(collateral)
                // .setRequiredSigners([address.to_js_value()])
                // .setTimeToExpire(slot);

                const unsignedTx = await tx.build();
                const signedTx = await walletApi.signTx(unsignedTx, true);
                console.log(readTransaction(signedTx));
                const txHash = await koios.submitTx(signedTx);
                console.log({ txHash });
              } catch (error) {
                console.log(error);
              }
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

    return mkModule({
      deposit,
    });
  })
);
