import { PropsWithChildren } from 'react';
import { Button } from 'react95';
import {
  WindowHeader,
  StyledWindow,
  WindowContent,
  WindowTitle,
} from './styled';
import { CloseIcon } from '../close-icon';

type Props = {
  id?: string;
  title?: string;
  iconSrc?: string;
  active?: boolean;
  onClose?: () => void;
};

export const Window = ({
  title,
  iconSrc,
  id,
  active,
  children,
  onClose,
}: PropsWithChildren<Props>) => {
  return (
    <StyledWindow>
      <WindowHeader id={id} active={active}>
        <WindowTitle>
          {iconSrc && <img width={20} height={20} src={iconSrc} alt="icon" />}
          {title}
        </WindowTitle>
        {onClose && (
          <Button
            onMouseDown={(event) => event.stopPropagation()}
            onPointerCancel={onClose}
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        )}
      </WindowHeader>
      <WindowContent>{children}</WindowContent>
    </StyledWindow>
  );
};
