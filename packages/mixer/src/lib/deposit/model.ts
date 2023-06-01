import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { mkSecretManager } from '@mixer/secret-manager';
import { combineEff, withEff } from '@mixer/utils';
import {
  EMPTY,
  Observable,
  Subject,
  finalize,
  first,
  forkJoin,
  from,
  iif,
  of,
  switchMap,
  tap,
  OperatorFunction,
  timer,
  map,
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
  mkSecretManager,
  combineEff(({ getSecretInfo$ }) => {
    const depositAction$ = new Subject();
    const submitDepositAction$ = new Subject<boolean>();

    const poolSize$ = newAtom<number>(10);
    const depositing$ = newAtom<boolean>(false);
    const note$ = newAtom<string | null>(null);

    const depositFlow$ = forkJoin([
      getSecretInfo$(),
      from(poolSize$).pipe(first()),
    ]).pipe(
      tap(() => depositing$.set(true)),
      tap(([[secret, nullifier], poolSize]) => {
        note$.set(
          `ada-${poolSize}-${Buffer.from(nullifier).toString(
            'hex'
          )}${Buffer.from(secret).toString('hex')}`
        );
      }),
      switchMap(([[, , commitmentHash]], poolSize) =>
        forkJoin([
          submitDepositAction$.pipe(first()),
          of(commitmentHash),
          of(poolSize),
        ])
      ),
      switchMap(([submitted]) =>
        submitted ? timer(2000).pipe(map(() => submitted)) : of(submitted)
      ),
      tap({
        next: (submitted) => {
          console.log(submitted ? 'success' : 'fail');
        },
      }),
      finalize(() => depositing$.set(false))
    );

    const depositEffect$ = makeEffect(
      depositAction$,
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

const makeEffect = <V, R>(
  action$: Observable<V>,
  flow: OperatorFunction<V, R>
) => action$.pipe(flow);
