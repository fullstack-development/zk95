import {
  Subject,
  catchError,
  finalize,
  switchMap,
  tap,
  EMPTY,
  of,
  share,
  iif,
} from 'rxjs';
import { Property, newAtom } from '@frp-ts/core';
import axios from 'axios';
import { getAddressDetails } from 'lucid-cardano';

import { injectable, token } from '@mixer/injectable';
import { combineEff, withEff } from '@mixer/eff';
import { mkProofGenerator } from '@mixer/proof-generator';
import { mkOffchainManager } from '@mixer/offchain-manager';
import { mkTransactionWatcherService } from '@mixer/transaction-watcher';
import { parseNote } from '../utils';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdraw: (note: string, address: string) => void;
};

export const mkWithdrawService = injectable(
  token('relayerEndpoint')<string>(),
  mkProofGenerator,
  mkOffchainManager,
  mkTransactionWatcherService,
  combineEff(
    (
      relayerEndpoint,
      { generate$ },
      { getPoolConfig, getPoolTree$ },
      { watchTx }
    ) => {
      const withdrawing$ = newAtom<boolean>(false);
      const withdrawAction$ = new Subject<{ note: string; address: string }>();

      const withdrawFlow$ = (value: { note: string; address: string }) =>
        of(value).pipe(
          tap(() => withdrawing$.set(true)),
          switchMap(({ note, address }) => {
            const [nominal, nullifier, secret] = parseNote(note);
            const details = getAddressDetails(address);

            return getPoolTree$(nominal).pipe(
              switchMap((tree) =>
                generate$(
                  nullifier,
                  secret,
                  tree,
                  details.paymentCredential?.hash ?? ''
                )
              ),
              switchMap((fullProof) => {
                const {
                  address,
                  nullifiersTokenUnit,
                  treeTokenUnit,
                  vaultTokenUnit,
                } = getPoolConfig(nominal);
                return axios
                  .post(relayerEndpoint, {
                    fullProof,
                    poolInfo: {
                      address,
                      treeTokenUnit,
                      nullifiersTokenUnit,
                      vaultTokenUnit,
                      nominal,
                    },
                  })
                  .then((res) => res.data as string);
              }),
              tap((txHash) => watchTx(txHash))
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
    }
  )
);
