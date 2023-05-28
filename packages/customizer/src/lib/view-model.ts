import { newAtom, Property } from '@frp-ts/core';
import themes from 'react95/dist/themes';

import { injectable } from '@mixer/injectable';
import { makeViewModel } from '@mixer/utils';

export type ThemeKey = keyof typeof themes;

export type CustomizeViewModel = {
  selectedTheme$: Property<ThemeKey>;
  themes: typeof themes;
  setTheme: (themeKey: ThemeKey) => void;
};

export const mkCustomizeViewModel = injectable(() => {
  const selectedTheme$ = newAtom<ThemeKey>('original');

  return makeViewModel<CustomizeViewModel>({
    selectedTheme$,
    themes,
    setTheme: selectedTheme$.set,
  });
});
