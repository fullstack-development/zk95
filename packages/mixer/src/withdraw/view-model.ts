import { Property, combine, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { combineEffFactory } from '@mixer/eff';
import { mkWithdrawService } from './service';
import { mkProofGenerator } from '@mixer/proof-generator';

export type WithdrawFromViewModel = {
  note$: Property<string>;
  address$: Property<string>;
  withdrawing$: Property<boolean>;
  generationProgress$: Property<number | null>;
  setNote: (note: string) => void;
  setAddress: (address: string) => void;
  withdraw: () => void;
};

export const mkWithdrawFormViewModel = injectable(
  mkWithdrawService,
  mkProofGenerator,
  combineEffFactory(
    ({ withdrawing$, withdraw }, { generationStep$ }) =>
      (): WithdrawFromViewModel => {
        const note$ = newAtom<string>('');
        const address$ = newAtom<string>('');

        return {
          note$,
          address$,
          withdrawing$,
          generationProgress$: combine(generationStep$, (step) =>
            step ? Number(((step * 100) / 918).toFixed(2)) : null
          ),
          setNote: note$.set,
          setAddress: address$.set,
          withdraw: () => withdraw(note$.get(), address$.get()),
        };
      }
  )
);
