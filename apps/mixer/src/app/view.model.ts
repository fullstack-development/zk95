import { injectable } from '@mixer/injectable';
import { mkDepositModel, mkWithdrawModel } from '@mixer/mixer';
import { makeViewModel } from '@mixer/utils';
import { mkWalletModel } from '@mixer/wallet';

export const mkSyncEffectsViewModel = injectable(
  mkWalletModel,
  mkDepositModel,
  mkWithdrawModel,
  (walletModel, depositModel, withdrawModel) => () => {
    return makeViewModel(
      undefined,
      walletModel.connectEnabledWalletEffect$,
      depositModel.depositEffect$,
      withdrawModel.withdrawEffect$
    );
  }
);
