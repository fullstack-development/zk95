import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { combineEffFactory, withEff } from '@mixer/utils';
import { mkWithdrawModel } from './model';
import { interval, tap } from 'rxjs';

export type WithdrawFromViewModel = {
  note$: Property<string>;
  address$: Property<string>;
  setNote: (note: string) => void;
  setAddress: (address: string) => void;
};

export const mkWithdrawFromViewModel = injectable(
  mkWithdrawModel,
  combineEffFactory((model) => () => {
    const note$ = newAtom<string>('');
    const address$ = newAtom<string>('');

    return withEff<WithdrawFromViewModel>(
      {
        note$,
        address$,
        setNote: note$.set,
        setAddress: address$.set,
      },
      interval(1000).pipe(
        tap(() => console.log('mkWithdrawFromViewModel effect'))
      )
    );
  })
);
