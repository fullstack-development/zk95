import { MenuList, MenuListItem } from 'react95';
import styled from 'styled-components';

export const Root = styled.div`
  position: relative;
  height: 100%;
  display: grid;
  justify-content: start;
  align-content: center;
`;

export const Menu = styled(MenuList)`
  position: absolute;
  left: 0;
  display: grid;
  grid-template-columns: 25px 1fr;
  width: 250px;
  bottom: 100%;
`;

export const MenuItem = styled(MenuListItem)`
  display: grid;
  grid-template-columns: 50px max-content;
  justify-content: start;
  cursor: pointer;
`;

export const MenuSideBar = styled.div`
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.borderDark};
`;
