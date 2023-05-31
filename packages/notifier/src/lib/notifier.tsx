import { injectable } from '@mixer/injectable';

import { InfoIcon } from '@mixer/icons';

import { mkNotifierModel } from './model';

export const mkNotifier = injectable(mkNotifierModel, (model) => () => {
  return <img width={20} height={20} src={InfoIcon} alt="info" />;
});
