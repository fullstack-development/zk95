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

import { injectable, token } from '@mixer/injectable';
import { combineEff, withEff } from '@mixer/eff';
import { mkProofGenerator } from '@mixer/proof-generator';
import { mkOffchainManager } from '@mixer/offchain-manager';
import { parseNote } from '../utils';
import axios from 'axios';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdraw: (note: string, address: string) => void;
};

export const mkWithdrawService = injectable(
  token('relayerEndpoint')<string>(),
  mkProofGenerator,
  mkOffchainManager,
  combineEff((relayerEndpoint, { generate$ }, { getPoolTree$ }) => {
    const withdrawing$ = newAtom<boolean>(false);
    const withdrawAction$ = new Subject<{ note: string; address: string }>();

    const withdrawFlow$ = (value: { note: string; address: string }) =>
      of(value).pipe(
        tap(() => withdrawing$.set(true)),
        switchMap(({ note, address }) => {
          const [nominal, nullifier, secret] = parseNote(note);
          return getPoolTree$(nominal).pipe(
            switchMap((tree) => generate$(nullifier, secret, tree, address)),
            switchMap((proof) => {
              return axios.post(relayerEndpoint, { nominal, proof });
            })
          );
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
