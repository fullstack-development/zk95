import styled from 'styled-components';
import {
  WindowHeader as React95WinHeader,
  WindowContent as React95WindowContent,
  Window,
} from 'react95';

export const StyledWindow = styled(Window)`
  display: grid;
  grid-template-rows: 36px 1fr;
  grid-template-columns: 100%;
  width: 100%;
  height: 100%;
`;

export const WindowHeader = styled(React95WinHeader)`
  display: grid;
  height: 36px;
  grid-template-columns: 1fr max-content;
  align-items: center;
  align-content: center;
`;

export const WindowContent = styled(React95WindowContent)`
  display: grid;
  padding: 16px;
`;

export const WindowTitle = styled.h2`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
  column-gap: 5px;
  margin: 0;
`;
