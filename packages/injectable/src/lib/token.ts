import { InjectableWithName } from './injectable';

export interface TokenAccessor {
  <Name extends PropertyKey, Dependencies extends Record<Name, unknown>>(
    dependencies: Dependencies,
    name: Name
  ): Dependencies[Name];
}

export function token<Name extends PropertyKey>(name: Name) {
  return <Type = never>(): InjectableWithName<
    {
      readonly name: Name;
      readonly type: Type;
      readonly optional: false;
      readonly children: readonly [];
    },
    Type
  > => {
    const f = (dependencies: Record<Name, Type>): Type => {
      return dependencies[name];
    };
    f.key = name;
    return f;
  };
}
