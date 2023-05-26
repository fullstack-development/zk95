import { FC, useContext, useEffect, useMemo } from 'react';
import { concat } from 'rxjs';
import { Injectable } from './injectable';
import { UnknownDependencies, context } from './context';

export function runDeps<Input extends Injectable<string, unknown>>(
  ...injectables: [Input, ...Input[]]
) {
  function wrapper<
    Props extends Record<string, unknown> = Record<string, never>
  >(Component: FC<Props>) {
    return (props: Props) => {
      const dependencies = useContext(context);

      const modules = useMemo(
        () =>
          injectables.map(
            (injectable) => [injectable.key, injectable(dependencies)] as const
          ),
        [dependencies]
      );

      const effect = useMemo(
        () =>
          concat(
            ...modules
              .map(([, module]) => module[0])
              .filter((effect) => effect !== undefined)
          ),
        [modules]
      );
      const value = useMemo(
        () =>
          Object.fromEntries(
            modules.map(([key, module]) => [key, module[1]] as const)
          ),
        [modules]
      );

      useEffect(() => {
        const subscription = effect.subscribe();
        return () => subscription.unsubscribe();
      }, [effect]);

      const mergedDependencies: UnknownDependencies = useMemo(
        () => ({
          ...dependencies,
          ...value,
        }),
        [dependencies, value]
      );
      return (
        <context.Provider value={mergedDependencies}>
          {<Component {...props} />}
        </context.Provider>
      );
    };
  }

  return wrapper;
}
