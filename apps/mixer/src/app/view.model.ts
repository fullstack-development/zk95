import { injectable } from '@mixer/injectable';
import { mkDepositModel } from '@mixer/mixer';
import { makeViewModel } from '@mixer/utils';
import { SUPPORTED_WALLETS, mkWalletModel } from '@mixer/wallet';
import { EMPTY, NEVER, filter, first, from, mergeAll, switchMap } from 'rxjs';

export const mkSyncEffectsViewModel = injectable(
  mkWalletModel,
  mkDepositModel,
  (walletModel, depositModel) => () => {
    const connectEnabledWalletEffect$ = from(
      SUPPORTED_WALLETS.map((w) =>
        window?.cardano?.[w]
          ? from(
              window.cardano[w]
                .isEnabled()
                .then((enabled) => (enabled ? window.cardano[w] : undefined))
            )
          : EMPTY
      )
    ).pipe(
      mergeAll(),
      filter((w): w is (typeof window.cardano)[string] => !!w),
      first(null, null),
      switchMap((wallet) =>
        wallet ? from(walletModel.connectWallet(wallet.name)) : NEVER
      )
    );

    return makeViewModel(
      undefined,
      connectEnabledWalletEffect$,
      depositModel.depositEffect$
    );
  }
);
