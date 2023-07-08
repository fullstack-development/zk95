import { Button, Hourglass, TextInput, ProgressBar } from 'react95';
import { useProperties } from '@frp-ts/react';

import { injectable } from '@mixer/injectable';
import { useRunEff } from '@mixer/eff';

import { mkWithdrawFormViewModel } from './view-model';
import { Field, Fieldset, Footer, WithdrawForm } from './styled';

export const mkWithdrawForm = injectable(
  mkWithdrawFormViewModel,
  (vm) => () => {
    const {
      note$,
      address$,
      withdrawing$,
      generationProgress$,
      setNote,
      setAddress,
      withdraw,
    } = useRunEff(vm, []);
    const [note, address, withdrawing, generationProgress] = useProperties(
      note$,
      address$,
      withdrawing$,
      generationProgress$
    );

    return (
      <WithdrawForm
        onSubmit={(e) => {
          e.preventDefault();
          withdraw();
        }}
      >
        <Fieldset>
          <Field>
            <label>Note</label>
            <TextInput
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
              value={address}
              placeholder="Paste address here"
              width={150}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
            />
          </Field>
        </Fieldset>
        <Footer>
          {generationProgress && <ProgressBar value={generationProgress} />}
          <Button type="submit">
            {withdrawing ? (
              <>
                {generationProgress && 'Generating proof...'} <Hourglass />
              </>
            ) : (
              'Withdraw'
            )}
          </Button>
        </Footer>
      </WithdrawForm>
    );
  }
);
