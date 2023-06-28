import { useState } from 'react';
import { Button, Radio, Hourglass } from 'react95';
import { useProperties } from '@frp-ts/react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Modal } from '@mixer/components';
import { injectable, token } from '@mixer/injectable';
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
import { POOLS_CONFIG_KEY, PoolInfo } from '@mixer/offchain';

export const mkDepositForm = injectable(
  token(POOLS_CONFIG_KEY)<Record<number, PoolInfo>>(),
  mkDepositModel,
  combineEff(
    (
        poolsConfig,
        {
          poolSize$,
          note$,
          depositing$,
          submitDeposit,
          rejectDeposit,
          deposit,
          setPoolSize,
        }
      ) =>
      () => {
        const [poolSize, note, depositing] = useProperties(
          poolSize$,
          note$,
          depositing$
        );

        return (
          <DepositFormContent>
            <PoolsBox label="Pools" disabled={depositing}>
              {Object.values(poolsConfig).map((pool) => (
                <Radio
                  key={pool.nominal}
                  checked={poolSize === pool.nominal}
                  onChange={() => setPoolSize(pool.nominal)}
                  value={pool.nominal}
                  label={`₳${pool.nominal}`}
                  name={pool.nominal.toString()}
                />
              ))}
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
              <NoteModal note={note} onSubmit={submitDeposit} />
            </Modal>
          </DepositFormContent>
        );
      }
  )
);

type NoteModalProps = {
  note: string | null;
  onSubmit: () => void;
};

const NoteModal = ({ note, onSubmit }: NoteModalProps) => {
  const [copied, setCopied] = useState(false);
  return (
    <ModalContent>
      <CopyToClipboard text={note ?? ''} onCopy={() => setCopied(true)}>
        <NoteField variant="field">{note}</NoteField>
      </CopyToClipboard>
      <ModalFooter>
        <span>{copied && 'Copied to clipboard!'}</span>
        <Button disabled={!copied} onClick={onSubmit}>
          Submit
        </Button>
      </ModalFooter>
    </ModalContent>
  );
};
