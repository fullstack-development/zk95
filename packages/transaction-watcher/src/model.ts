import { Property, combine, newAtom } from '@frp-ts/core';

import {
  ChainIndexProvider,
  chainIndexProvider,
} from '@mixer/chain-index-provider';
import { injectable } from '@mixer/injectable';
import { filter, from, interval, switchMap, tap, throttle } from 'rxjs';
import { Eff, withEff } from '@mixer/utils';

type TxStatusList = Record<string, TxStatus>;

type TxHashesInfo = Record<string, number | null>;

export type TxStatus = 'pending' | 'submitted' | 'failed';

export type TransactionWatcher = {
  txStatuses$: Property<TxStatusList>;
  watchTx: (txHash: string) => void;
};

export function transactionWatcherModel(
  provider: ChainIndexProvider
): Eff<TransactionWatcher> {
  const txHashesInfo$ = newAtom<TxHashesInfo>({});

  const txHashesToWatch$ = combine(txHashesInfo$, (txHashesInfo) => {
    return Object.keys(txHashesInfo).filter((txHash) => {
      const status = txHashesInfo[txHash];
      return status !== null && status > 0;
    });
  });

  const txStatuses$ = combine(txHashesInfo$, (txHashesInfo) => {
    return Object.keys(txHashesInfo).reduce<TxStatusList>((acc, txHash) => {
      const status = txHashesInfo[txHash];
      acc[txHash] =
        status === null ? 'submitted' : status > 0 ? 'pending' : 'failed';
      return acc;
    }, {});
  });

  const watchTx = (txHash: string) => {
    txHashesInfo$.modify((prev) => ({ ...prev, [txHash]: 12 }));
  };

  const watchEffect$ = from(txHashesToWatch$).pipe(
    filter((txHashes) => txHashes.length > 0),
    throttle(() => interval(5000), { leading: true, trailing: true }),
    switchMap((txHashes) => provider.getTxsInfo(txHashes)),
    tap((responseTxStatuses) => {
      txHashesInfo$.modify((txHashesInfo) => {
        const nextTxsInfo = Object.keys(txHashesInfo).reduce<TxHashesInfo>(
          (acc, txHash) => {
            const currentStatus = txHashesInfo[txHash];
            if (
              responseTxStatuses[txHash] === false &&
              currentStatus !== null &&
              currentStatus > 0
            ) {
              acc[txHash] = currentStatus - 1;
            } else if (responseTxStatuses[txHash] === true) {
              acc[txHash] = null;
            } else {
              acc[txHash] = txHashesInfo[txHash];
            }
            return acc;
          },
          {}
        );

        return nextTxsInfo;
      });
    })
  );

  return withEff(
    {
      txStatuses$,
      watchTx,
    },
    watchEffect$
  );
}

export const mkTransactionWatcherModel = injectable(
  chainIndexProvider,
  transactionWatcherModel
);
