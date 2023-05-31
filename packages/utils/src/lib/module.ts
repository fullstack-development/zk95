import { memoMany } from '@frp-ts/utils';
import { useEffect, useMemo } from 'react';
import { ObservableInput, merge } from 'rxjs';

type MapToValueIfModule<Targets> = {
  readonly [Index in keyof Targets]: Targets[Index] extends Module<infer Value>
    ? Value
    : Targets[Index] extends infer Value
    ? Value
    : never;
};

const moduleValue = Symbol('@moduleValue');
const moduleEffect = Symbol('@moduleEffect');

export interface Module<Value> {
  [moduleValue]: Value;
  [moduleEffect]: Set<ObservableInput<unknown>>;
}

export function bindModule<Value, Targets extends readonly unknown[]>(
  bind: (...values: MapToValueIfModule<Targets>) => Module<Value> | Value
): (...targets: Targets) => Module<Value>;
export function bindModule(
  bind: (...values: unknown[]) => unknown
): (...targets: unknown[]) => Module<unknown> {
  const memoizedBind = memoMany(bind);

  return (...targets: unknown[]) => {
    const values = targets.map((target) =>
      isModule(target) ? target[moduleValue] : target
    );

    const effects = targets
      .filter(isModule)
      .reduce<Set<ObservableInput<unknown>>>(
        (acc, module) => new Set([...acc, ...module[moduleEffect]]),
        new Set()
      );

    const value = memoizedBind(...values);

    if (isModule(value)) {
      return {
        [moduleValue]: value[moduleValue],
        [moduleEffect]: new Set([...effects, ...value[moduleEffect]]),
      };
    }

    return {
      [moduleValue]: value,
      [moduleEffect]: effects,
    };
  };
}

export function bindModuleFactory<
  Value,
  Args extends readonly unknown[],
  Targets extends readonly unknown[]
>(
  mkFactory: (
    ...values: MapToValueIfModule<Targets>
  ) => (...args: Args) => Module<Value> | Value
): (...targets: Targets) => (...args: Args) => Module<Value>;
export function bindModuleFactory(
  mkFactory: (...values: unknown[]) => (...args: unknown[]) => unknown
): (...targets: unknown[]) => (...args: unknown[]) => Module<unknown> {
  const memoizedMkFactory = memoMany(mkFactory);

  return (...targets: unknown[]) => {
    const values = targets.map((target) =>
      isModule(target) ? target[moduleValue] : target
    );
    const effects = targets
      .filter(isModule)
      .reduce<Set<ObservableInput<unknown>>>(
        (acc, module) => new Set([...acc, ...module[moduleEffect]]),
        new Set()
      );

    const factory = memoizedMkFactory(...values);
    const memoizedFactory = memoMany(factory);

    return (...args: unknown[]) => {
      const value = memoizedFactory(...args);

      if (isModule(value)) {
        return {
          [moduleValue]: value[moduleValue],
          [moduleEffect]: new Set([...effects, ...value[moduleEffect]]),
        };
      }
      return {
        [moduleValue]: value,
        [moduleEffect]: effects,
      };
    };
  };
}

export function mkModule<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
): Module<Value> {
  return {
    [moduleValue]: value,
    [moduleEffect]: new Set(effects),
  };
}

export function getModuleValue<Value>(module: Module<Value>): Value {
  return module[moduleValue];
}

export function getModuleRunEffect(module: Module<unknown>): () => () => void {
  const effect = merge(...module[moduleEffect]);
  return () => {
    const subscription = effect.subscribe();

    return () => subscription.unsubscribe();
  };
}

export function useRunModule<Value, Args extends unknown[]>(
  factory: (...args: Args) => Module<Value>,
  args: Args
): Value;
export function useRunModule<Value>(module: Module<Value>): Value;
export function useRunModule(
  moduleOrFactory: Module<unknown> | ((...args: unknown[]) => Module<unknown>),
  args: unknown[] = []
): unknown {
  const module = useMemo(() => {
    if (typeof moduleOrFactory === 'function') {
      return moduleOrFactory(...args);
    }

    return moduleOrFactory;
  }, [moduleOrFactory, ...args]);

  const value = useMemo(() => getModuleValue(module), [module]);
  const runEffect = useMemo(() => getModuleRunEffect(module), [module]);

  useEffect(runEffect, [runEffect]);

  return value;
}

const isModule = (value: unknown): value is Module<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  moduleValue in value &&
  moduleEffect in value;
