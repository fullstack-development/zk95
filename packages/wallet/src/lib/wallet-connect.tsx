import { useState } from 'react';
import { Anchor, Avatar, Button, Hourglass, Separator } from 'react95';
import { useProperties, useProperty } from '@frp-ts/react';

import { WindowsIcon, UserIcon } from '@mixer/icons';
import { combineEff } from '@mixer/eff';
import { useClickOutside } from '@mixer/utils';

import { WalletService, mkWalletService } from './service';
import { Root, Menu, MenuItem, MenuSideBar, UserItem } from './styled';
import { injectable } from '@mixer/injectable';
import { WalletKey } from './supported-wallets';

export const mkWalletConnect = injectable(
  mkWalletService,
  combineEff((model) => () => {
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
  model: WalletService;
  onClose: () => void;
};

const WalletsList = ({
  model: {
    installedWallets,
    supportedWallets,
    wallet$,
    address$,
    adaBalance$,
    connectWallet,
  },
  onClose,
}: WalletsListProps) => {
  const [address, adaBalance, connectedWallet] = useProperties(
    address$,
    adaBalance$,
    wallet$
  );
  const ref = useClickOutside<HTMLUListElement>(onClose);
  const isWalletConnected = (key: WalletKey) =>
    connectedWallet?.info.key === key;

  const isWalletInstalled = (key: WalletKey) =>
    installedWallets[key] !== undefined;

  const handleMenuItemClick = (key: WalletKey) => {
    connectWallet(key);
    onClose();
  };

  const handleWalletInstall = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Menu ref={ref}>
      <MenuSideBar>
        <span>Mixuper</span>
        <span>95</span>
      </MenuSideBar>
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
                  ₳{adaBalance.toString()}
                </>
              ) : (
                <Hourglass />
              )}
            </UserItem>
            <Separator />
          </>
        )}
        {supportedWallets.map(([key, name, url, icon]) => (
          <MenuItem
            key={name}
            onClick={() =>
              isWalletInstalled(key)
                ? handleMenuItemClick(key)
                : handleWalletInstall(url)
            }
            disabled={isWalletConnected(key)}
          >
            <Avatar
              square
              noBorder
              src={icon}
              style={
                isWalletConnected(key) ? { filter: 'grayscale(1)' } : undefined
              }
            />
            {name} {isWalletConnected(key) && '(Connected)'}
          </MenuItem>
        ))}
      </div>
    </Menu>
  );
};
