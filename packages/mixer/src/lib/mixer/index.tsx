import { useState } from 'react';
import { Tabs, Tab, TabBody } from 'react95';

import { DepositForm } from '../deposit';
import { MainContent } from './styled';

export const Mixer = () => {
  const [tab, setTab] = useState<number>(0);

  return (
    <MainContent>
      <Tabs value={tab} onChange={setTab}>
        <Tab style={{ cursor: 'pointer' }} value={0}>
          Deposit
        </Tab>
        <Tab style={{ cursor: 'pointer' }} value={1}>
          Withdraw
        </Tab>
      </Tabs>
      <TabBody>
        {tab === 0 && <DepositForm />}
        {tab === 1 && 'Withdraw'}
      </TabBody>
    </MainContent>
  );
};
