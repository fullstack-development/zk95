import { Frame, Monitor } from 'react95';
import styled from 'styled-components';

export const Root = styled.div`
  display: grid;
  grid-template-rows: 1fr 50px;
  background-color: ${({ theme }) => theme.desktopBackground};
  height: 100%;
`;

export const Main = styled.main`
  display: grid;
  justify-content: center;
  align-items: center;
`;

export const Footer = styled.footer`
  display: grid;
`;

export const InfoFrame = styled(Frame)`
  display: grid;
  align-items: center;
  padding: 0 10px;
  height: 100%;
`;

export const StyledMonitor = styled(Monitor)`
  transform: scale(1.5);
`;
