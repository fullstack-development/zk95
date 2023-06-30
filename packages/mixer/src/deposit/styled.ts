import { Frame, GroupBox } from 'react95';
import styled from 'styled-components';

export const DepositFormContent = styled.form`
  display: grid;
  height: 100%;
  align-content: space-between;
  grid-template-rows: max-content 50px;
`;

export const ModalContent = styled.div`
  display: grid;
  height: 100%;
  align-content: space-between;
  grid-template-rows: max-content 50px;
`;

export const ModalFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-content: end;
  align-items: center;
`;

export const NoteField = styled(Frame)`
  padding: 10px;
  word-break: break-all;
  cursor: pointer;
`;

export const Footer = styled.div`
  display: grid;
  justify-items: end;
  align-items: end;
`;

export const PoolsBox = styled(GroupBox)`
  display: grid;
  grid-auto-flow: column;
`;
