import { PlutusScript, resolvePlutusScriptAddress } from '@meshsdk/core'
import { useState } from 'react';
import styled from 'styled-components';
import { AppBar, Frame, Toolbar } from 'react95'

import { Mixer } from '@mixer/mixer'
import { WalletConnect } from '@mixer/wallet-connect'
import { deps } from '../core/dependencies'

const Root = styled.div`
  display: grid;
  grid-template-rows: 1fr 50px;
  background-color: ${({ theme }) => theme.desktopBackground};
  height: 100%;
`

const Main = styled.main`
  display: grid;
  justify-content: center;
  align-items: center;
`

const Footer = styled.footer`
  display: grid;
`

const script: PlutusScript = {
  code: '4746010000222499',
  version: 'V1'
}

const scriptAddress = resolvePlutusScriptAddress(script, 0);

export function App() {
  const [tab, setTab] = useState<number>(0);

  return (
    <Root>
      <Main>
        <Mixer />
      </Main>
      <Footer>
        <AppBar position="static" style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr max-content' }}>
          <WalletConnect vm$={deps.walletConnect} />
          <div />
          <Toolbar>
            <Frame variant="status">7:23 PM</Frame>
          </Toolbar>
        </AppBar>
      </Footer>
    </Root>
  );
}

export default App;
