import { useState } from 'react';
import {
  Tabs,
  Tab,
  Window,
  WindowContent,
  WindowHeader,
  TabBody,
} from 'react95';

import { DepositForm } from '../deposit';

export const Mixer = () => {
  const [tab, setTab] = useState<number>(0);

  return (
    <Window style={{ width: 450 }}>
      <WindowHeader>cardano_mixer.exe</WindowHeader>
      <WindowContent>
        <Tabs value={tab} onChange={setTab}>
          <Tab value={0}>Deposit</Tab>
          <Tab value={1}>Withdraw</Tab>
        </Tabs>
        <TabBody style={{ height: 250 }}>
          {tab === 0 && <DepositForm />}
          {tab === 1 && 'Withdraw'}
        </TabBody>
      </WindowContent>
    </Window>
  );
};
