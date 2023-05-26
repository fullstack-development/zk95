import { createContext } from 'react';

export type UnknownDependencies = {
  readonly [name: string]: unknown;
};

export const context = createContext<UnknownDependencies>({});
