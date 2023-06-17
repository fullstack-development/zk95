import { memoMany } from '@frp-ts/utils';
import { useEffect, useMemo } from 'react';
import { Observable, ObservableInput, merge, share } from 'rxjs';

type ExtractValue<Effs> = {
  readonly [Index in keyof Effs]: Effs[Index] extends Eff<infer Value>
    ? Value
    : Effs[Index] extends infer Value
    ? Value
    : never;
};

const valueSymbol = Symbol('@value');
const effectSymbol = Symbol('@effect');

export interface Eff<Value> {
  [valueSymbol]: Value;
  [effectSymbol]: Observable<unknown>;
}

export function combineEff<Value, Targets extends readonly unknown[]>(
  project: (...values: ExtractValue<Targets>) => Eff<Value> | Value
): (...targets: Targets) => Eff<Value>;
export function combineEff(
  project: (...values: unknown[]) => unknown
): (...targets: unknown[]) => Eff<unknown> {
  return (...targets: unknown[]) => {
    const values = targets.map((target) =>
      isEff(target) ? target[valueSymbol] : target
    );

    const effects = targets.filter(isEff).map((eff) => eff[effectSymbol]);
    const value = project(...values);

    if (isEff(value)) {
      return {
        [valueSymbol]: value[valueSymbol],
        [effectSymbol]: merge(...effects, value[effectSymbol]),
      };
    }

    return {
      [valueSymbol]: value,
      [effectSymbol]: merge(...effects),
    };
  };
}

export function combineEffFactory<
  Value,
  Args extends readonly unknown[],
  Targets extends readonly unknown[]
>(
  mkFactory: (
    ...values: ExtractValue<Targets>
  ) => (...args: Args) => Eff<Value> | Value
): (...targets: Targets) => (...args: Args) => Eff<Value>;
export function combineEffFactory(
  mkFactory: (...values: unknown[]) => (...args: unknown[]) => unknown
): (...targets: unknown[]) => (...args: unknown[]) => Eff<unknown> {
  const memoizedMkFactory = memoMany(mkFactory);

  return (...targets: unknown[]) => {
    const values = targets.map((target) =>
      isEff(target) ? target[valueSymbol] : target
    );
    const effects = targets.filter(isEff).map((eff) => eff[effectSymbol]);

    const project = memoizedMkFactory(...values);

    return (...args: unknown[]) => {
      const value = project(...args);

      if (isEff(value)) {
        return {
          [valueSymbol]: value[valueSymbol],
          [effectSymbol]: merge(...effects, value[effectSymbol]),
        };
      }
      return {
        [valueSymbol]: value,
        [effectSymbol]: merge(...effects),
      };
    };
  };
}

export function withEff<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
): Eff<Value> {
  return {
    [valueSymbol]: value,
    [effectSymbol]: merge(...effects).pipe(share()),
  };
}

export function runEff<V>(eff: Eff<V>): [V, () => void] {
  const subscription = eff[effectSymbol].subscribe();
  return [eff[valueSymbol], () => subscription.unsubscribe()];
}

export function useRunEff<Value, Args extends unknown[]>(
  factory: (...args: Args) => Eff<Value>,
  args: Args
): Value;
export function useRunEff<Value>(eff: Eff<Value>): Value;
export function useRunEff(
  effOrFactory: Eff<unknown> | ((...args: unknown[]) => Eff<unknown>),
  args: unknown[] = []
): unknown {
  const eff = useMemo(() => {
    if (isEff(effOrFactory)) {
      return effOrFactory;
    }

    return effOrFactory(...args);
  }, [effOrFactory, ...args]);

  useEffect(() => {
    const subscription = eff[effectSymbol].subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [eff]);

  return eff[valueSymbol];
}

const isEff = (value: unknown): value is Eff<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  valueSymbol in value &&
  effectSymbol in value;
