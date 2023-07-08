/* eslint-disable @typescript-eslint/ban-ts-comment */
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ModalProvider } from 'styled-react-modal';
import { styleReset } from 'react95';
// @ts-ignore
import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
// @ts-ignore
import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { useProperties } from '@frp-ts/react';

import { PoolInfo } from '@mixer/offchain';
import { ModalBackground } from '@mixer/components';
import { mkCustomizeModel } from '@mixer/customizer';
import { injectable } from '@mixer/injectable';
import { useRunEff } from '@mixer/eff';

import { mkApp } from './app/app';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif}') format('woff2');
    font-weight: 400;
    font-style: normal
  }
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif_bold}') format('woff2');
    font-weight: bold;
    font-style: normal
  }
  body, input, select, textarea {
    font-family: 'ms_sans_serif';
  }

  html, body, #root {
    font-family: 'ms_sans_serif';
    height: 100vh;
  }

  * {
    box-sizing: border-box;
  }
`;

const poolsConfig = (() => {
  try {
    const context = require.context('../../../pools', false, /\.json$/);
    return context
      .keys()
      .map(context)
      .filter((config): config is PoolInfo => {
        const validation = PoolInfo.safeParse(config);

        return validation.success && validation.data.network === 'Preprod';
      })
      .reduce<Record<string, PoolInfo>>((acc, pool) => {
        acc[pool.nominal] = pool;
        return acc;
      }, {});
  } catch {
    return {};
  }
})();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const mkRoot = injectable(
  mkCustomizeModel,
  mkApp,
  (customizeModel, appEff) => () => {
    const [themeKey] = useProperties(customizeModel.selectedTheme$);
    const App = useRunEff(appEff);

    return (
      <StrictMode>
        <GlobalStyles />
        <ThemeProvider theme={customizeModel.themes[themeKey]}>
          <ModalProvider backgroundComponent={ModalBackground}>
            <App />
          </ModalProvider>
        </ThemeProvider>
      </StrictMode>
    );
  }
);

const Root = mkRoot({
  poolsConfig,
  zKeyConfig: {
    url: process.env['NX_ZKEY_STORAGE_URL'] ?? '',
    version: 1,
  },
});

root.render(<Root />);
