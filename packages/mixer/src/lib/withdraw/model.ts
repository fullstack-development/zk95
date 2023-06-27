import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { combineEff, withEff } from '@mixer/eff';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { mkOffchainConsumer } from '@mixer/offchain-consumer';
import { mkTransactionWatcherModel } from '@mixer/transaction-watcher';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdraw: (note: string, address: string) => void;
};

export const mkWithdrawModel = injectable(
  mkOffchainConsumer,
  mkTransactionWatcherModel,
  combineEff(({ withdraw$ }, { watchTx }) => {
    const withdrawing$ = newAtom<boolean>(false);
    const withdrawAction$ = new Subject<{ note: string; address: string }>();

    const withdrawEffect$ = withdrawAction$.pipe(
      switchMap(({ note, address }) => withdraw$(note, address)),
      tap((txHash) => watchTx(txHash)),
      catchError(() => {
        console.log('rejected');
        return EMPTY;
      })
    );

    return withEff<WithdrawModel>(
      {
        withdrawing$,
        withdraw: (note, address) => withdrawAction$.next({ note, address }),
      },
      withdrawEffect$
    );
  })
);
