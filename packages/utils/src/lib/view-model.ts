import { useEffect } from 'react';
import { ObservableInput, Observable, merge } from 'rxjs';

export type ViewModel<Value> = {
  readonly 0: Observable<unknown>;
  readonly 1: Value;
};

export function makeViewModel<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
) {
  return [merge(...effects), value] as const;
}

export const useViewModel = <V>(vm: ViewModel<V>): V => {
  useEffect(() => {
    const subscription = vm[0].subscribe();
    return () => subscription.unsubscribe();
  }, [vm]);

  return vm[1];
};
