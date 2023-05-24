import { useState } from 'react';
import { Avatar, Button } from 'react95';
import { useProperties, useProperty } from '@frp-ts/react';
import { Property } from '@frp-ts/core';

import { WindowsIcon } from '@mixer/icons';
import { BrowserWallet, Wallet } from '@meshsdk/core';

import type { ConnectWalletViewModel } from './view-model';
import { Root, Menu, MenuItem, MenuSideBar } from './styled';
import { ViewModel, useClickOutside, useViewModel } from '@mixer/utils';

export function WalletConnect({
  vm$,
}: {
  vm$: ViewModel<ConnectWalletViewModel>;
}) {
  const [open, setOpen] = useState(false);
  const vm = useViewModel(vm$);
  const address = useProperty(vm.address$);

  return (
    <Root>
      <Button
        onClick={() => setOpen(!open)}
        active={open}
        style={{ fontWeight: 'bold' }}
      >
        <img
          src={WindowsIcon}
          alt="react95 logo"
          style={{ height: '20px', marginRight: 4 }}
        />
        {address
          ? address.replace(/(_.{8})(.*)(.{4})/i, '$1...$3')
          : 'Connect Wallet'}
      </Button>
      {open && (
        <WalletsList
          connectedWallet$={vm.wallet$}
          wallets$={vm.walletsToConnect$}
          onSelect={vm.connectWallet}
          onClose={() => setOpen(false)}
        />
      )}
    </Root>
  );
}

type WalletsListProps = {
  connectedWallet$: Property<{ api: BrowserWallet; name: string } | null>;
  wallets$: Property<Wallet[]>;
  onSelect: (walletName: string) => void;
  onClose: () => void;
};

const WalletsList = ({
  connectedWallet$,
  wallets$,
  onSelect,
  onClose,
}: WalletsListProps) => {
  const [wallets, connectedWallet] = useProperties(wallets$, connectedWallet$);
  const ref = useClickOutside<HTMLUListElement>(onClose);

  return (
    <Menu ref={ref}>
      <MenuSideBar />
      <div onClick={onClose}>
        {wallets.map((w) => (
          <MenuItem key={w.name} onClick={() => onSelect(w.name)}>
            <Avatar square src={w.icon} noBorder />
            {w.name}
          </MenuItem>
        ))}
        {connectedWallet && (
          <MenuItem primary disabled>
            {/* 68                <Avatar square src={connectedWallet.icon} noBorder /> */}
            {connectedWallet.name}
          </MenuItem>
        )}
      </div>
    </Menu>
  );
};
