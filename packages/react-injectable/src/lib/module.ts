import { Observable, ObservableInput, merge } from 'rxjs';

export type Effect = ObservableInput<unknown>;

export interface Module<T> extends ReadonlyArray<unknown> {
  readonly 0: Observable<unknown>;
  readonly 1: T;
}

export const makeModule = <T>(value: T, ...effects: Effect[]): Module<T> => {
  return [merge(...effects), value] as const;
};
