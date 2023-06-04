import styled from 'styled-components';
import {
  WindowHeader as React95WinHeader,
  WindowContent as React95WindowContent,
  Window,
} from 'react95';

export const StyledWindow = styled(Window)`
  width: 100%;
  height: 100%;
`;

export const WindowHeader = styled(React95WinHeader)`
  display: grid;
  height: 36px;
  grid-template-columns: 1fr max-content;
  align-items: center;
  align-content: center;
  color: ${({ theme, active }) =>
    active ? theme.headerText : theme.headerNotActiveText};
`;

export const WindowContent = styled(React95WindowContent)`
  height: calc(100% - 36px);
`;

export const WindowTitle = styled.h2`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
  column-gap: 5px;
  margin: 0;
`;
