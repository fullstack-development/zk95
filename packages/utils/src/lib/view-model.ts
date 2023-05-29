import { useEffect, useMemo } from 'react';
import { ObservableInput, Observable, merge } from 'rxjs';

export type ViewModel<Value> = {
  readonly 0: Observable<unknown>;
  readonly 1: Value;
};

export function makeViewModel<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
): ViewModel<Value> {
  return [merge(...effects), value] as const;
}

export const useViewModel = <A, Args extends unknown[]>(
  mViewModel: ((...args: Args) => ViewModel<A>) | ViewModel<A>,
  args: Args
): A => {
  const vm = useMemo(
    () => (typeof mViewModel === 'function' ? mViewModel(...args) : mViewModel),
    [mViewModel, ...args]
  );

  useEffect(() => {
    const subscription = vm[0].subscribe();
    return () => subscription.unsubscribe();
  }, [vm[0]]);

  return vm[1];
};
