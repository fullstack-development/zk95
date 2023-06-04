import { useState } from 'react';
import { Button, Radio, Hourglass } from 'react95';
import { useProperties } from '@frp-ts/react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Modal } from '@mixer/components';
import { injectable } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';

import { mkDepositModel } from './model';
import {
  DepositFormContent,
  Footer,
  ModalContent,
  ModalFooter,
  NoteField,
  PoolsBox,
} from './styled';

export const mkDepositForm = injectable(
  mkDepositModel,
  combineEff(
    ({
        poolSize$,
        note$,
        depositing$,
        submitDeposit,
        rejectDeposit,
        deposit,
        setPoolSize,
      }) =>
      () => {
        const [poolSize, note, depositing] = useProperties(
          poolSize$,
          note$,
          depositing$
        );

        const [copied, setCopied] = useState(false);

        return (
          <DepositFormContent>
            <PoolsBox label="Pools" disabled={depositing}>
              <Radio
                checked={poolSize === 1}
                onChange={(event) => setPoolSize(Number(event.target.value))}
                value={1}
                label="₳1"
                disabled
                name="1"
              />
              <br />
              <Radio
                checked={poolSize === 10}
                onChange={(event) => setPoolSize(Number(event.target.value))}
                value={10}
                label="₳10"
                disabled
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
                disabled
                name="fruits"
              />
            </PoolsBox>
            <Footer>
              <Button onClick={deposit} disabled={depositing}>
                {depositing ? <Hourglass /> : 'Deposit'}
              </Button>
            </Footer>
            <Modal
              onClose={rejectDeposit}
              title="Secret Note"
              open={note !== null}
            >
              <ModalContent>
                <CopyToClipboard
                  text={note ?? ''}
                  onCopy={() => setCopied(true)}
                >
                  <NoteField variant="field">{note}</NoteField>
                </CopyToClipboard>
                <ModalFooter>
                  <span>{copied && 'Copied to clipboard!'}</span>
                  <Button disabled={!copied} onClick={submitDeposit}>
                    Submit
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </DepositFormContent>
        );
      }
  )
);
