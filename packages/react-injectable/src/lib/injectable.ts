import { UnknownDependencies } from './context';
import { Module } from './module';
import type { Token, TokenValue } from './token';

export interface Injectable<Key extends string, Value> {
  (deps: UnknownDependencies): Module<Value>;
  readonly key: Key;
}

type MapToValues<Inputs> = {
  readonly [Index in keyof Inputs]: TokenValue<Inputs[Index]>;
};

export function injectable<
  Key extends string,
  Value,
  Inputs extends readonly Token<unknown>[]
>(
  ...args: [Key, ...Inputs, (...values: MapToValues<Inputs>) => Module<Value>]
): Injectable<Key, Value>;
export function injectable(...args: unknown[]): Injectable<string, unknown> {
  const key = args[0] as string;
  const tokens: Token<unknown>[] = args.slice(1, args.length - 1) as never;
  const project: (...values: unknown[]) => Module<unknown> = args[
    args.length - 1
  ] as never;

  const f = (dependencies: UnknownDependencies): Module<unknown> => {
    const deps = tokens.map((t) => t(dependencies));
    return project(...deps);
  };

  f.key = key;
  return f;
}
