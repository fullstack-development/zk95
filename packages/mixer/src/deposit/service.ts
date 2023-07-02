import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { mkOffchainManager } from 'packages/offchain-manager/src';
import { getRandomValues, hashConcat, toHex } from '@mixer/crypto';
import { mkTransactionWatcherService } from '@mixer/transaction-watcher';
import { combineEff, withEff } from '@mixer/eff';
import {
  EMPTY,
  Subject,
  finalize,
  first,
  forkJoin,
  iif,
  of,
  switchMap,
  tap,
  catchError,
  throwError,
  defer,
  share,
} from 'rxjs';

export type DepositModel = {
  poolSize$: Property<number>;
  note$: Property<string | null>;
  depositing$: Property<boolean>;
  setPoolSize: (size: number) => void;
  deposit: () => void;
  submitDeposit: () => void;
  rejectDeposit: () => void;
};

export const mkDepositService = injectable(
  mkTransactionWatcherService,
  mkOffchainManager,
  combineEff((watcherModel, { deposit$ }) => {
    const depositAction$ = new Subject();
    const submitDepositAction$ = new Subject<boolean>();

    const poolSize$ = newAtom<string>('100000000');
    const depositing$ = newAtom<boolean>(false);
    const note$ = newAtom<string | null>(null);

    const depositFlow$ = defer(() =>
      of([getRandomValues(31), getRandomValues(31), poolSize$.get()] as const)
    ).pipe(
      tap(() => depositing$.set(true)),
      tap(([nullifier, secret, poolSize]) => {
        note$.set(`ada-${poolSize}-${toHex(nullifier)}${toHex(secret)}`);
      }),
      switchMap(([nullifier, secret, poolSize]) =>
        forkJoin([
          submitDepositAction$.pipe(first()),
          of(hashConcat(nullifier, secret)),
          of(poolSize),
        ])
      ),
      switchMap(([submitted, commitmentHash, poolSize]) =>
        submitted
          ? deposit$(poolSize, commitmentHash)
          : throwError(() => 'rejected')
      ),
      tap({
        next: (txHash) => watcherModel.watchTx(txHash),
      }),
      catchError((error) => {
        console.log(error);
        return EMPTY;
      }),
      finalize(() => depositing$.set(false)),
      share({ resetOnRefCountZero: false })
    );

    const depositEffect$ = depositAction$.pipe(
      switchMap(() => iif(() => !depositing$.get(), depositFlow$, EMPTY))
    );

    return withEff(
      {
        poolSize$,
        note$,
        depositing$,
        setPoolSize: poolSize$.set,
        deposit: () => depositAction$.next(void 0),
        submitDeposit: () => {
          submitDepositAction$.next(true);
          note$.set(null);
        },
        rejectDeposit: () => {
          submitDepositAction$.next(false);
          note$.set(null);
        },
      },
      depositEffect$
    );
  })
);
