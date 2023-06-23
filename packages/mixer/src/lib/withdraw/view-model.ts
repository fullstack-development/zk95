import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { combineEffFactory, withEff } from '@mixer/eff';
import { mkWithdrawModel } from './model';

export type WithdrawFromViewModel = {
  note$: Property<string>;
  address$: Property<string>;
  setNote: (note: string) => void;
  setAddress: (address: string) => void;
  withdraw: () => void;
};

export const mkWithdrawFromViewModel = injectable(
  mkWithdrawModel,
  combineEffFactory((model) => () => {
    const note$ = newAtom<string>('');
    const address$ = newAtom<string>('');

    return withEff<WithdrawFromViewModel>({
      note$,
      address$,
      setNote: note$.set,
      setAddress: address$.set,
      withdraw: () => model.withdraw(note$.get(), address$.get()),
    });
  })
);
