import { useState } from 'react';
import { Anchor, Avatar, Button, Hourglass, Separator } from 'react95';
import { useProperties, useProperty } from '@frp-ts/react';

import { WindowsIcon, UserIcon } from '@mixer/icons';

import { bindModule, useClickOutside } from '@mixer/utils';
import { WalletModel, mkWalletModel } from './model';
import { Root, Menu, MenuItem, MenuSideBar, UserItem } from './styled';
import { injectable } from '@mixer/injectable';

export const mkWalletConnect = injectable(
  mkWalletModel,
  bindModule((model) => () => {
    const [open, setOpen] = useState(false);
    const wallet = useProperty(model.wallet$);

    return (
      <Root>
        <Button
          onClick={() => setOpen(!open)}
          active={open}
          style={{ fontWeight: 'bold' }}
        >
          <img
            src={wallet ? wallet.info.icon : WindowsIcon}
            alt="react95 logo"
            style={{ height: '20px', marginRight: 4 }}
          />
          {wallet ? wallet.info.name : 'Connect Wallet'}
        </Button>
        {open && <WalletsList model={model} onClose={() => setOpen(false)} />}
      </Root>
    );
  })
);

type WalletsListProps = {
  model: WalletModel;
  onClose: () => void;
};

const WalletsList = ({
  model: { availableWallets$, wallet$, address$, adaBalance$, connectWallet },
  onClose,
}: WalletsListProps) => {
  const [wallets, address, connectedWallet, adaBalance] = useProperties(
    availableWallets$,
    address$,
    wallet$,
    adaBalance$
  );
  const ref = useClickOutside<HTMLUListElement>(onClose);
  const isWalletConnected = (name: string) =>
    connectedWallet?.info.name === name;

  const handleMenuItemClick = (walletName: string) => {
    connectWallet(walletName);
    onClose();
  };

  return (
    <Menu ref={ref}>
      <MenuSideBar />
      <div>
        {connectedWallet && (
          <>
            <UserItem>
              <Avatar square noBorder src={UserIcon} />
              {address ? (
                <>
                  <Anchor
                    href={`https://preprod.cardanoscan.io/address/${address}`}
                    target="_blank"
                    style={{ marginRight: '5px' }}
                  >
                    {address?.replace(/^(.{4})(.*)(.{4})/i, '$1...$3')}
                  </Anchor>
                  ₳{adaBalance.toFixed(2)}
                </>
              ) : (
                <Hourglass />
              )}
            </UserItem>
            <Separator />
          </>
        )}
        {wallets.map((w) => (
          <MenuItem
            key={w.name}
            onClick={() => handleMenuItemClick(w.name)}
            disabled={isWalletConnected(w.name)}
          >
            <Avatar
              square
              noBorder
              src={w.icon}
              style={
                isWalletConnected(w.name)
                  ? { filter: 'grayscale(1)' }
                  : undefined
              }
            />
            {w.name} {isWalletConnected(w.name) && '(Connected)'}
          </MenuItem>
        ))}
      </div>
    </Menu>
  );
};
