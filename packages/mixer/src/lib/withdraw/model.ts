import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { Observable, Subject, of } from 'rxjs';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdrawEffect$: Observable<unknown>;
  withdraw: (note: string, address: string) => void;
};

export const mkWithdrawModel = injectable((): WithdrawModel => {
  const withdrawing$ = newAtom<boolean>(false);
  const withdrawAction$ = new Subject<{ note: string; address: string }>();

  const withdrawEffect$ = of();

  return {
    withdrawing$,
    withdrawEffect$,
    withdraw: (note, address) => withdrawAction$.next({ note, address }),
  };
});
