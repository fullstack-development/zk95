import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
  interval,
  from,
  of,
  mergeMap,
} from 'rxjs';
import {
  Lucid,
  Address,
  Data,
  Constr,
  fromText,
  TxHash,
  Assets,
  Blockfrost,
} from 'lucid-cardano';

import { ONCHAIN_CONFIG_KEY, OnchainConfig } from '@mixer/onchain-config';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/utils';
import { mkWalletModel } from '@mixer/wallet';

export type Offchain = {
  deposit$: (poolSize: number, commitmentHash: string) => Observable<TxHash>;
  withdraw$: () => void;
};

export const mkOffchain = injectable(
  token(ONCHAIN_CONFIG_KEY)<OnchainConfig>(),
  mkWalletModel,
  combineEff((onchainConfig, walletModel): Offchain => {
    const provider = new Blockfrost(
      'https://cardano-preprod.blockfrost.io/api/v0',
      'preprodZpZ9X9GL1xL5vajWd8VNxHxcTyYoMePJ'
    );
    const lucid$ = combineLatest([
      Lucid.new(provider, 'Preprod'),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      ),
      shareReplay(1)
    );

    const deposit$ = (poolSize: number, commitmentHash: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) =>
          (async () => {
            const config = onchainConfig[poolSize];

            if (config === undefined) {
              throw new Error(`Pool with ${poolSize} nominal not found`);
            }

            const depositScriptAddress: Address =
              lucid.utils.validatorToAddress({
                type: config.script.type,
                script: config.script.cbor,
              });

            const UTxOsWithScriptRef = await lucid.utxosAt(
              config.addressWithScriptRef
            );
            const depositUTxOs = await lucid.utxosAt(depositScriptAddress);

            const referenceScriptUTxO = UTxOsWithScriptRef.find((utxo) =>
              Boolean(utxo.scriptRef)
            );

            if (!referenceScriptUTxO)
              throw new Error('Reference script not found');

            const poolUTxO = depositUTxOs.find(
              (utxo) => utxo.assets[config.tokenUnit] !== undefined
            );

            if (!poolUTxO) throw new Error('Pool not found');

            const redeemer = Data.to(new Constr(0, [fromText(commitmentHash)]));

            const tx = await lucid
              .newTx()
              .readFrom([referenceScriptUTxO])
              .collectFrom([poolUTxO], redeemer)
              .payToContract(
                depositScriptAddress,
                { inline: poolUTxO.datum ?? undefined },
                sumAssets(poolUTxO.assets, { lovelace: BigInt('100000000') })
              )
              .complete();
            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();
            return txHash;
          })()
        )
      );

    const withdraw$ = () => {
      //
    };

    function sumAssets(...assets: Assets[]) {
      return assets.reduce<Assets>((acc, assets) => {
        Object.keys(assets).forEach((unit) => {
          acc[unit] = (acc[unit] ?? BigInt(0)) + assets[unit];
        });

        return acc;
      }, {});
    }

    return {
      deposit$,
      withdraw$,
    };
  })
);
