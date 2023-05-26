import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import ReactModal, { BaseModalBackground } from 'styled-react-modal';

import { Window } from '../window';

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
    <ReactModal isOpen={open} beforeClose={onClose}>
      <Window title={title} onClose={onClose}>
        {children}
      </Window>
    </ReactModal>
  );
};

export const ModalBackground = styled(BaseModalBackground)`
  background-color: transparent;
`;
