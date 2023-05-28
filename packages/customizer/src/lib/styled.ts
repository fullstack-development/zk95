import styled from 'styled-components';
import { GroupBox, AppBar as React95AppBar } from 'react95';

export const MainContent = styled.div`
  display: grid;
  row-gap: 30px;
  grid-template-rows: max-content max-content 1fr;
  align-content: stretch;
  justify-content: stretch;
  justify-items: center;
`;

export const MonitorContent = styled.div`
  display: grid;
  grid-template-rows: calc(100% - 40px) 40px;
  width: calc(100% / 0.4);
  height: calc(100% / 0.4);
  background-color: ${({ theme }) => theme.desktopBackground};
  transform-origin: 0 0;
  transform: scale(0.4);
  user-select: none;
  pointer-events: none;
`;

export const MonitorDesktop = styled.div`
  display: grid;
  grid-auto-rows: 1fr;
  grid-auto-columns: 1fr;
  grid-template-areas:
    '. . . . .'
    '. w w . .'
    '. w w . .'
    '. . . . .'
    '. . . . .';
`;

export const MonitorWindow = styled.div`
  display: grid;
  grid-area: w;
`;

export const AppBar = styled(React95AppBar)`
  display: grid;
  justify-content: start;
  position: static;
  height: 100%;
`;

export const ThemeSelectBox = styled(GroupBox)`
  display: grid;
  width: 100%;
`;

export const Footer = styled.footer`
  display: grid;
  justify-items: end;
  align-items: end;
  width: 100%;
`;
