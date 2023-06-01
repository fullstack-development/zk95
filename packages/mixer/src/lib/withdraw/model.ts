import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { withEff } from '@mixer/utils';
import { EMPTY, Subject, switchMap } from 'rxjs';

export type WithdrawModel = {
  withdrawing$: Property<boolean>;
  withdraw: (note: string, address: string) => void;
};

export const mkWithdrawModel = injectable(() => {
  const withdrawing$ = newAtom<boolean>(false);
  const withdrawAction$ = new Subject<{ note: string; address: string }>();

  const withdrawEffect$ = withdrawAction$.pipe(switchMap(() => EMPTY));

  return withEff<WithdrawModel>(
    {
      withdrawing$,
      withdraw: (note, address) => withdrawAction$.next({ note, address }),
    },
    withdrawEffect$
  );
});
