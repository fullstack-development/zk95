import { Frame, Monitor } from 'react95';
import styled from 'styled-components';

export const Root = styled.div`
  display: grid;
  grid-template-rows: 1fr 50px;
  height: 100%;
`;

export const Main = styled.main`
  display: grid;
  justify-content: stretch;
  align-content: stretch;
`;

export const Footer = styled.footer`
  display: grid;
`;

export const InfoFrame = styled(Frame)`
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 6px;
  align-items: center;
  padding: 0 10px;
  height: 100%;
`;

export const StyledMonitor = styled(Monitor)`
  transform: scale(1.5);
`;
