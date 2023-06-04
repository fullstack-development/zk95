import {
  Observable,
  Property,
  Time,
  multicast,
  newProperty,
  now,
} from '@frp-ts/core';
import { memo1 } from '@frp-ts/utils';

export const fromObservable = <T, V extends T>(
  ma: Observable<T & V>,
  value: T & V
): Property<T> => {
  const proxy: Observable<Time> = multicast({
    subscribe: (observer) => {
      return ma.subscribe({
        next: (nextValue) => {
          if (nextValue !== value) {
            value = nextValue;
            observer.next(now());
          }
        },
      });
    },
  });

  return newProperty(() => value, proxy.subscribe);
};

export const mapProperty = <A, B>(fa: Property<A>, f: (a: A) => B) => {
  const memoF = memo1(f);
  const get = () => memoF(fa.get());
  return newProperty(get, fa.subscribe);
};
