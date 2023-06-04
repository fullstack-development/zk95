import { Button, TextInput } from 'react95';
import { useProperties } from '@frp-ts/react';

import { injectable } from '@mixer/injectable';
import { useRunEff } from '@mixer/eff';

import { mkWithdrawFromViewModel } from './view-model';
import { Field, Fieldset, Footer, WithdrawForm } from './styled';

export const mkWithdrawForm = injectable(
  mkWithdrawFromViewModel,
  (vm) => () => {
    const { note$, address$, setNote, setAddress } = useRunEff(vm, []);
    const [note, address] = useProperties(note$, address$);

    return (
      <WithdrawForm>
        <Fieldset>
          <Field>
            <label>Note</label>
            <TextInput
              variant="flat"
              value={note}
              placeholder="Note"
              width={150}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
            />
          </Field>
          <Field>
            <label>Recipient Address</label>
            <TextInput
              variant="flat"
              value={address}
              placeholder="Paste address here"
              width={150}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
            />
          </Field>
        </Fieldset>
        <Footer>
          <Button>Withdraw</Button>
        </Footer>
      </WithdrawForm>
    );
  }
);
