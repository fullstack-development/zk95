/* eslint-disable-next-line */

import { injectable } from '@mixer/injectable';
import { Anchor, Hourglass } from 'react95';
import { Content, ScrollView, TxHash, TxItem, TxStatusIcon } from './styled';
import { TxStatus, mkTransactionWatcherModel } from '../model';
import { useProperties } from '@frp-ts/react';
import { ErrorIcon, SuccessIcon } from '@mixer/icons';
import { combineEff } from '@mixer/eff';

export const mkTransactionWatcher = injectable(
  mkTransactionWatcherModel,
  combineEff(({ txStatuses$ }) => () => {
    const [txStatuses] = useProperties(txStatuses$);

    const getStatusContent = (txStatus: TxStatus) => {
      if (txStatus === 'pending') {
        return <Hourglass />;
      }

      return (
        <img
          width={24}
          height={24}
          src={txStatus === 'failed' ? ErrorIcon : SuccessIcon}
          alt="icon"
        />
      );
    };

    return (
      <Content>
        <ScrollView shadow={true}>
          {Object.keys(txStatuses).map((txHash) => (
            <TxItem key={txHash}>
              <TxStatusIcon>
                {getStatusContent(txStatuses[txHash])}
              </TxStatusIcon>
              <Anchor
                href={`https://preprod.cexplorer.io/tx/${txHash}`}
                target="_blank"
                style={{ width: '100%', overflow: 'hidden' }}
                underline
              >
                <TxHash>{txHash}</TxHash>
              </Anchor>
            </TxItem>
          ))}
        </ScrollView>
      </Content>
    );
  })
);
