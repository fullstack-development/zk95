import styled from 'styled-components';
import { Toolbar as React95Toolbar, Button as React95Button } from 'react95';

export const Toolbar = styled(React95Toolbar)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32px, 160px));
  column-gap: 5px;
  justify-content: start;
`;

export const Button = styled(React95Button)`
  display: grid;
  justify-content: start;
  grid-auto-flow: column;
  align-items: center;
  column-gap: 5px;
  overflow: hidden;
  padding: 0 5px;
`;
