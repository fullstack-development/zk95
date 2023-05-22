import { useState } from 'react';
import { Avatar, Button, MenuList } from 'react95';
import { useProperty } from '@frp-ts/react';
import { Property } from '@frp-ts/core';

import { WindowsIcon } from '@mixer/icons';
import { Wallet } from '@meshsdk/core';

import type { ViewModel } from './view-model'
import { Root, Menu, MenuItem, MenuSideBar } from './styled'

export function WalletConnect({ vm }: { vm: ViewModel }) {
  const [open, setOpen] = useState(false);

  const address = useProperty(vm.address$)

  return (
    <Root>
      <Button onClick={() => setOpen(!open)}
        active={open}
        style={{ fontWeight: 'bold' }}>
        <img
          src={WindowsIcon}
          alt="react95 logo"
          style={{ height: '20px', marginRight: 4 }}
        />
        {address ? address : 'Connect Wallet'}
      </Button>
      {open && <WalletsList wallets$={vm.installedWallets$} onSelect={vm.connectWallet} onClose={() => setOpen(false)} />}
    </Root>
  );
}

const WalletsList = ({ wallets$, onSelect, onClose }: { wallets$: Property<Wallet[]>, onSelect: (walletName: string) => void, onClose: () => void }) => {
  const wallets = useProperty(wallets$)

  return (
    <Menu>
      <MenuSideBar />
      <div
        onClick={onClose}
      >
        {wallets.map(w => (
          <MenuItem key={w.name} onClick={() => onSelect(w.name)}>
            <Avatar square src={w.icon} noBorder />
            {w.name}
          </MenuItem>
        ))}
      </div>
    </Menu>)
}
