import {
  Observable,
  Property,
  Time,
  multicast,
  newProperty,
  now,
} from '@frp-ts/core';

export const fromObservable = <T>(ma: Observable<T>, value: T): Property<T> => {
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
