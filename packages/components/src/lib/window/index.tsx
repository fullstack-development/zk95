import { PropsWithChildren } from 'react';
import { Button, Window as React95Win, WindowContent } from 'react95';
import { WindowHeader } from './styled';
import { CloseIcon } from '../close-icon';

type Props = {
  title?: string;
  onClose?: () => void;
};

export const Window = ({
  title,
  children,
  onClose,
}: PropsWithChildren<Props>) => {
  return (
    <React95Win>
      <WindowHeader>
        <span>{title}</span>
        {onClose && (
          <Button onClick={onClose}>
            <CloseIcon />
          </Button>
        )}
      </WindowHeader>
      <WindowContent>{children}</WindowContent>
    </React95Win>
  );
};
