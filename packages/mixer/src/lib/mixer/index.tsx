import { useState } from 'react';
import { Tabs, Tab, Window, WindowContent, WindowHeader, TabBody } from 'react95'

export const Mixer = () => {

  const [tab, setTab] = useState<number>(0);

  return (
    <Window style={{ width: 500 }}>
      <WindowHeader>cardano_mixer.exe</WindowHeader>
      <WindowContent>
        <Tabs value={tab} onChange={setTab}>
          <Tab value={0}>Deposit</Tab>
          <Tab value={1}>Withdraw</Tab>
        </Tabs>
        <TabBody style={{ height: 300 }}>
          Deposit
        </TabBody>
      </WindowContent>
    </Window>
  )
}
