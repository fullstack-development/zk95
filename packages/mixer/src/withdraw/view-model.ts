import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { combineEffFactory } from '@mixer/eff';
import { mkWithdrawService } from './service';

export type WithdrawFromViewModel = {
  note$: Property<string>;
  address$: Property<string>;
  withdrawing$: Property<boolean>;
  setNote: (note: string) => void;
  setAddress: (address: string) => void;
  withdraw: () => void;
};

export const mkWithdrawFormViewModel = injectable(
  mkWithdrawService,
  combineEffFactory((model) => (): WithdrawFromViewModel => {
    const note$ = newAtom<string>('');
    const address$ = newAtom<string>('');

    return {
      note$,
      address$,
      withdrawing$: model.withdrawing$,
      setNote: note$.set,
      setAddress: address$.set,
      withdraw: () => model.withdraw(note$.get(), address$.get()),
    };
  })
);
