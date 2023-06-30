import {
  Subject,
  catchError,
  finalize,
  map,
  switchMap,
  tap,
  EMPTY,
  of,
  share,
  iif,
} from 'rxjs';
import { Property, newAtom } from '@frp-ts/core';

import { injectable } from '@mixer/injectable';
import { combineEff, withEff } from '@mixer/eff';
import { mkProofGenerator } from '@mixer/proof-generator';
import { mkOffchainManager } from '@mixer/offchain-manager';
import { parseNote } from '../utils';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdraw: (note: string, address: string) => void;
};

// ada-100-9878fe74a661a11e10e4e77416dc6251d00d8d5308b73d6361d4e2b99e054f8504e6276eef68f3ebbdda9d1e6a0f6f8605cfbe748bfa4cc5c824414fc9a8

export const mkWithdrawService = injectable(
  mkProofGenerator,
  mkOffchainManager,
  combineEff(({ generate$ }, { getPoolTree$ }) => {
    const withdrawing$ = newAtom<boolean>(false);
    const withdrawAction$ = new Subject<{ note: string; address: string }>();

    const withdrawFlow$ = (value: { note: string; address: string }) =>
      of(value).pipe(
        tap(() => withdrawing$.set(true)),
        switchMap(({ note, address }) => {
          const [poolSize, nullifier, secret] = parseNote(note);
          return getPoolTree$(poolSize).pipe(
            switchMap((tree) => generate$(nullifier, secret, tree, address))
          );
        }),
        switchMap((proof) => {
          console.log(proof);
          return EMPTY;
        }),
        catchError((error) => {
          console.log(error);
          return EMPTY;
        }),
        finalize(() => withdrawing$.set(false)),
        share({ resetOnRefCountZero: false })
      );

    const withdrawEffect$ = withdrawAction$.pipe(
      switchMap((value) =>
        iif(() => withdrawing$.get() === false, withdrawFlow$(value), EMPTY)
      )
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
