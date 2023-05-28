import { useState } from 'react';
import { Tabs, Tab, TabBody } from 'react95';

import { injectable } from '@mixer/injectable';

import { MainContent } from './styled';
import { mkDepositForm } from '../deposit';

export const mkMixer = injectable(mkDepositForm, (DepositForm) => () => {
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
});
