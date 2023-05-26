import { useContext } from 'react';
import { Token } from './token';
import { context } from './context';

export const useDependency = <Value>(token: Token<Value>): Value => {
  return token(useContext(context));
};
