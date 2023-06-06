import { injectable } from '@mixer/injectable';
import { InfoIcon } from '@mixer/icons';

import { mkNotifierModel } from '../model';
import { MessagePopup } from '../message-popup';
import { Content, Popup } from './styled';

export const mkNotifier = injectable(mkNotifierModel, (model) => () => {
  return (
    <Content>
      <img width={20} height={20} src={InfoIcon} alt="info" />
      <Popup>
        <MessagePopup />
      </Popup>
    </Content>
  );
});
