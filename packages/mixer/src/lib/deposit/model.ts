import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { mkOffchain } from '@mixer/offchain';
import { getRandomValues, hash, concatHashes, toHex } from '@mixer/hash';
import { mkTransactionWatcherModel } from '@mixer/transaction-watcher';
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

export const mkDepositModel = injectable(
  mkTransactionWatcherModel,
  mkOffchain,
  combineEff((watcherModel, { deposit$ }) => {
    const depositAction$ = new Subject();
    const submitDepositAction$ = new Subject<boolean>();

    const poolSize$ = newAtom<number>(100);
    const depositing$ = newAtom<boolean>(false);
    const note$ = newAtom<string | null>(null);

    const depositFlow$ = defer(() =>
      of([
        hash(getRandomValues(31)),
        hash(getRandomValues(31)),
        poolSize$.get(),
      ] as const)
    ).pipe(
      tap(() => depositing$.set(true)),
      tap(([nullifier, secret, poolSize]) => {
        note$.set(`ada-${poolSize}-${toHex(nullifier)}${toHex(secret)}`);
      }),
      switchMap(([nullifier, secret, poolSize]) =>
        forkJoin([
          submitDepositAction$.pipe(first()),
          of(concatHashes(secret, nullifier)),
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
      finalize(() => depositing$.set(false))
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
