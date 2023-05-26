import { UnknownDependencies } from './context';

export interface Token<Value> {
  (deps: UnknownDependencies): Value;
}

export type TokenValue<Input> = Input extends Token<infer Value>
  ? Value
  : never;

export function token<Key extends string>(key: Key) {
  return <Value = never>(): Token<Value> => {
    const dependencyExists = (dependency: unknown): dependency is Value => {
      return dependency !== undefined;
    };
    const f = (dependencies: UnknownDependencies): Value => {
      const dependency = dependencies[key];
      if (dependencyExists(dependency)) {
        return dependency;
      }

      throw Error(`Cannot resolve dependency: ${key}`);
    };
    f.key = key;
    return f;
  };
}
