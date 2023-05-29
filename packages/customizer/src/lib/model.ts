import { newAtom, Property } from '@frp-ts/core';
import themes from 'react95/dist/themes';

import { injectable } from '@mixer/injectable';

export type ThemeKey = keyof typeof themes;

export type CustomizeModel = {
  selectedTheme$: Property<ThemeKey>;
  themes: typeof themes;
  setTheme: (themeKey: ThemeKey) => void;
};

export const mkCustomizeModel = injectable((): CustomizeModel => {
  const selectedTheme$ = newAtom<ThemeKey>('original');

  return {
    selectedTheme$,
    themes,
    setTheme: selectedTheme$.set,
  };
});
