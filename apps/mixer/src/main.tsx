/* eslint-disable @typescript-eslint/ban-ts-comment */
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ModalProvider } from 'styled-react-modal';
import { styleReset } from 'react95';
import original from 'react95/dist/themes/original';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import { runDeps, token, useDependency } from '@mixer/react-injectable';
import { ModalBackground } from '@mixer/components';
import {
  CUSTOMIZE_VIEW_MODEL,
  CustomizeViewModel,
  mkCustomizeViewModel,
} from '@mixer/customizer';

import { App } from './app/app';

// @ts-ignore
import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
// @ts-ignore
import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';
import { useProperties } from '@frp-ts/react';

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
    height: 100vh;
  }
`;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const Root = runDeps(mkCustomizeViewModel)(() => {
  const customizeVM = useDependency(
    token(CUSTOMIZE_VIEW_MODEL)<CustomizeViewModel>()
  );
  const [themeKey] = useProperties(customizeVM.selectedTheme$);

  return (
    <StrictMode>
      <GlobalStyles />
      <ThemeProvider theme={customizeVM.themes[themeKey]}>
        <ModalProvider backgroundComponent={ModalBackground}>
          <App />
        </ModalProvider>
      </ThemeProvider>
    </StrictMode>
  );
});

root.render(<Root />);
