import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { makeViewModel } from '@mixer/utils';

export type DepositViewModel = {
  poolSize$: Property<number>;
  setPoolSize: (size: number) => void;
};

export const mkDepositViewModel = injectable(() => {
  const poolSize$ = newAtom<number>(10);

  return makeViewModel<DepositViewModel>(
    {
      poolSize$,
      setPoolSize: poolSize$.set,
    },
    Promise.resolve().then(() => console.log('effect'))
  );
});
