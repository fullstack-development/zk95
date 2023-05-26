import { newAtom, Property } from '@frp-ts/core';
import themes from 'react95/dist/themes';

import { injectable, makeModule } from '@mixer/react-injectable';

export type ThemeKey = keyof typeof themes;

export type CustomizeViewModel = {
  selectedTheme$: Property<ThemeKey>;
  themes: typeof themes;
  setTheme: (themeKey: ThemeKey) => void;
};

export const CUSTOMIZE_VIEW_MODEL = 'customizeViewModel';
export const mkCustomizeViewModel = injectable(CUSTOMIZE_VIEW_MODEL, () => {
  const selectedTheme$ = newAtom<ThemeKey>('original');

  return makeModule<CustomizeViewModel>({
    selectedTheme$,
    themes,
    setTheme: selectedTheme$.set,
  });
});
