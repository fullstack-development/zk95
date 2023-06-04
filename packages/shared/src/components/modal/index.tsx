import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import ReactModal, { BaseModalBackground } from 'styled-react-modal';

import { Window } from '../window';
import { ModalWindow } from './styled';

export type Props = {
  open: boolean;
  title?: string;
  onClose?: () => void;
};

export const Modal = ({
  open,
  title,
  children,
  onClose,
}: PropsWithChildren<Props>) => {
  return (
    <ReactModal isOpen={open} onBackgroundClick={onClose}>
      <ModalWindow>
        <Window title={title} onClose={onClose}>
          {children}
        </Window>
      </ModalWindow>
    </ReactModal>
  );
};

export const ModalBackground = styled(BaseModalBackground)`
  background-color: transparent;
`;
