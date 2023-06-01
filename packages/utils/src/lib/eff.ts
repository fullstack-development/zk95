import { memoMany } from '@frp-ts/utils';
import { useEffect, useMemo } from 'react';
import { ObservableInput, merge } from 'rxjs';

type ExtractValue<Effs> = {
  readonly [Index in keyof Effs]: Effs[Index] extends Eff<infer Value>
    ? Value
    : Effs[Index] extends infer Value
    ? Value
    : never;
};

const effValueSymbol = Symbol('@effValue');
const effectSymbol = Symbol('@effect');

export interface Eff<Value> {
  [effValueSymbol]: Value;
  [effectSymbol]: Set<ObservableInput<unknown>>;
}

export function combineEff<Value, Targets extends readonly unknown[]>(
  bind: (...values: ExtractValue<Targets>) => Eff<Value> | Value
): (...targets: Targets) => Eff<Value>;
export function combineEff(
  bind: (...values: unknown[]) => unknown
): (...targets: unknown[]) => Eff<unknown> {
  const memoizedBind = memoMany(bind);

  return (...targets: unknown[]) => {
    const values = targets.map((target) =>
      isEff(target) ? target[effValueSymbol] : target
    );

    const effects = targets
      .filter(isEff)
      .reduce<Set<ObservableInput<unknown>>>(
        (acc, module) => new Set([...acc, ...module[effectSymbol]]),
        new Set()
      );

    const value = memoizedBind(...values);

    if (isEff(value)) {
      return {
        [effValueSymbol]: value[effValueSymbol],
        [effectSymbol]: new Set([...effects, ...value[effectSymbol]]),
      };
    }

    return {
      [effValueSymbol]: value,
      [effectSymbol]: effects,
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
      isEff(target) ? target[effValueSymbol] : target
    );
    const effects = targets
      .filter(isEff)
      .reduce<Set<ObservableInput<unknown>>>(
        (acc, module) => new Set([...acc, ...module[effectSymbol]]),
        new Set()
      );

    const factory = memoizedMkFactory(...values);

    return (...args: unknown[]) => {
      const value = factory(...args);

      if (isEff(value)) {
        return {
          [effValueSymbol]: value[effValueSymbol],
          [effectSymbol]: new Set([...effects, ...value[effectSymbol]]),
        };
      }
      return {
        [effValueSymbol]: value,
        [effectSymbol]: effects,
      };
    };
  };
}

export function withEff<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
): Eff<Value> {
  return {
    [effValueSymbol]: value,
    [effectSymbol]: new Set(effects),
  };
}

export function effValue<Value>(eff: Eff<Value>): Value {
  return eff[effValueSymbol];
}

export function runEff(eff: Eff<unknown>): () => void {
  const effect = merge(...eff[effectSymbol]);
  const subscription = effect.subscribe();
  return () => subscription.unsubscribe();
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
    if (typeof effOrFactory === 'function') {
      return effOrFactory(...args);
    }

    return effOrFactory;
  }, [effOrFactory, ...args]);

  useEffect(() => runEff(eff), [eff]);

  return effValue(eff);
}

const isEff = (value: unknown): value is Eff<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  effValueSymbol in value &&
  effectSymbol in value;
