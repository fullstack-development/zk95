import { BrowserWallet, PlutusScript, resolvePlutusScriptAddress, Transaction, Wallet, Protocol, Action, Mint } from '@meshsdk/core'
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, AppBar, Monitor, Window, WindowHeader, WindowContent, Tabs, Tab, TabBody, Frame, Toolbar } from 'react95'

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

console.log(scriptAddress)
//53d9ed564a4cdeb49be454629461bf0347c93c0f3ccd7d7bf00846d439fec7c5
export function App() {
  const [wallet, setBrowserWallet] = useState<BrowserWallet | null>(null);

  useEffect(() => {
    BrowserWallet.enable('nami').then(setBrowserWallet)

  }, [])

  useEffect(() => {
    wallet?.getNetworkId().then(console.log)
  }, [wallet])

  return (
    <Root>
      <Main>
        <Window style={{ width: 500 }}>
          <WindowHeader>cardano_mixer.exe</WindowHeader>
          <WindowContent>
            <Tabs value={0} onChange={() => { }}>
              <Tab value={0}>Deposit</Tab>
              <Tab value={1}>Withdraw</Tab>
            </Tabs>
            <TabBody style={{ height: 300 }}>
              Deposit
            </TabBody>
          </WindowContent>
        </Window>
      </Main>
      <Footer>
        <AppBar position="static" style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr max-content' }}>
          <WalletConnect vm={deps.walletConnect} />
          <div />
          <Toolbar>
            <Frame variant="status">7:23 PM</Frame>
          </Toolbar>
        </AppBar>
      </Footer>
    </Root>
  );

  async function mint() {
    if (wallet) {

      const tx = new Transaction({ initiator: wallet })
        .sendLovelace(
          {
            address: scriptAddress
          },
          '1000000'
        )
        ;

      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);

      console.log(txHash)
    }
  };
}

export default App;
