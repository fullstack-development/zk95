import { memoMany } from '@frp-ts/utils';
import { useEffect, useMemo } from 'react';
import { ObservableInput, merge, share } from 'rxjs';

type ExtractValue<Effs> = {
  readonly [Index in keyof Effs]: Effs[Index] extends Eff<infer Value>
    ? Value
    : Effs[Index] extends infer Value
    ? Value
    : never;
};

const effSymbol = Symbol('@@eff');

export interface Eff<Value> {
  (): readonly [Value, () => void];
  [effSymbol]: true;
}

export function combineEff<Value, Inputs extends readonly unknown[]>(
  bind: (...values: ExtractValue<Inputs>) => Eff<Value> | Value
): (...inputs: Inputs) => Eff<Value>;
export function combineEff(
  bind: (...values: unknown[]) => unknown
): (...inputs: unknown[]) => Eff<unknown> {
  const memoizedBind = memoMany(bind);

  return (...inputs: unknown[]) => {
    const f = (() => {
      const instancies = inputs.map((input) =>
        isEff(input) ? input() : [input]
      );
      const values = instancies.map(([value]) => value);
      const disposes = instancies
        .filter((ins): ins is [unknown, () => void] => !!ins[1])
        .map(([, dispose]) => dispose);
      const newEff = memoizedBind(...values);

      if (isEff(newEff)) {
        const [newValue, newDispose] = newEff();
        const dispose = () => disposes.concat(newDispose).forEach((d) => d());
        return [newValue, dispose];
      }

      const dispose = () => disposes.forEach((d) => d());
      return [newEff, dispose] as const;
    }) as Eff<unknown>;

    f[effSymbol] = true;

    return f;
  };
}

export function combineEffFactory<
  Value,
  Args extends readonly unknown[],
  Inputs extends readonly unknown[]
>(
  bindFactory: (
    ...values: ExtractValue<Inputs>
  ) => (...args: Args) => Eff<Value> | Value
): (...inputs: Inputs) => (...args: Args) => Eff<Value>;
export function combineEffFactory(
  bindFactory: (...values: unknown[]) => (...args: unknown[]) => unknown
): (...inputs: unknown[]) => (...args: unknown[]) => Eff<unknown> {
  const memoizedBindFactory = memoMany(bindFactory);

  return (...inputs: unknown[]) => {
    return (...args: unknown[]) => {
      const f = (() => {
        const instancies = inputs.map((input) =>
          isEff(input) ? input() : [input]
        );
        const values = instancies.map(([value]) => value);
        const disposes = instancies
          .filter((ins): ins is [unknown, () => void] => !!ins[1])
          .map(([, dispose]) => dispose);

        const mkEff = memoizedBindFactory(...values);
        const newEff = mkEff(...args);

        if (isEff(newEff)) {
          const [newValue, newDispose] = newEff();
          const dispose = () => disposes.concat(newDispose).forEach((d) => d());
          return [newValue, dispose] as const;
        }

        const dispose = () => disposes.forEach((dispose) => dispose());
        return [newEff, dispose] as const;
      }) as Eff<unknown>;

      f[effSymbol] = true;

      return f;
    };
  };
}

export function withEff<Value>(
  value: Value,
  ...effects: ObservableInput<unknown>[]
): Eff<Value> {
  const effect$ = merge(...effects).pipe(share());
  const f = (() => {
    const subscription = effect$.subscribe();
    return [value, () => subscription.unsubscribe()] as const;
  }) as Eff<Value>;

  f[effSymbol] = true;

  return f;
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

  const [value, dispose] = useMemo(eff, [eff]);

  useEffect(
    () => () => {
      console.log('dispose');
      dispose();
    },
    [dispose]
  );

  return value;
}

const isEff = (value: unknown): value is Eff<unknown> =>
  typeof value === 'function' && value !== null && effSymbol in value;
