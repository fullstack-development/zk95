import { useEffect } from 'react';
import { Observable, ObservableInput, merge } from 'rxjs';

export interface ViewModel<T> extends ReadonlyArray<unknown> {
  readonly 0: Observable<unknown>;
  readonly 1: T;
}

export const mkViewModel = <T>(
  value: T,
  ...effects: ObservableInput<unknown>[]
): ViewModel<T> => {
  return [merge(...effects), value] as const;
};

export const useViewModel = <A>([effect, value]: ViewModel<A>): A => {
  // call current effect dispose on render
  useEffect(() => {
    const subscription = effect.subscribe();
    return () => subscription.unsubscribe();
  }, [effect]);

  return value;
};
