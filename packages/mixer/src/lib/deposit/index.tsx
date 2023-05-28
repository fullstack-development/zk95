import { Button, Radio } from 'react95';
import { useProperties } from '@frp-ts/react';
import { Modal } from '@mixer/components';

import { mkDepositViewModel } from './view-model';
import { DepositFormContent, FormFooter, PoolsBox } from './styled';
import { injectable } from '@mixer/injectable';
import { useViewModel } from '@mixer/utils';

export const mkDepositForm = injectable(mkDepositViewModel, (vm$) => () => {
  const { poolSize$, setPoolSize } = useViewModel(vm$);
  const [poolSize] = useProperties(poolSize$);

  return (
    <DepositFormContent>
      <PoolsBox label="Pools">
        <Radio
          checked={poolSize === 1}
          onChange={(event) => setPoolSize(Number(event.target.value))}
          value={1}
          label="₳1"
          name="1"
        />
        <br />
        <Radio
          checked={poolSize === 10}
          onChange={(event) => setPoolSize(Number(event.target.value))}
          value={10}
          label="₳10"
          name="10"
        />
        <br />
        <Radio
          checked={poolSize === 100}
          onChange={(event) => setPoolSize(Number(event.target.value))}
          value={100}
          label="₳100"
          name="100"
        />
        <br />
        <Radio
          checked={poolSize === 1000}
          onChange={(event) => setPoolSize(Number(event.target.value))}
          value={1000}
          label="₳1000"
          name="fruits"
        />
      </PoolsBox>
      <FormFooter>
        <Button>Deposit</Button>
      </FormFooter>
      <Modal open={false}>Test</Modal>
    </DepositFormContent>
  );
});
