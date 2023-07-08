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
  grid-template-columns: 30px 1fr;
  width: 300px;
  bottom: 100%;
`;

export const UserItem = styled(MenuListItem)`
  display: grid;
  grid-template-columns: 50px max-content 1fr;
  justify-content: start;
  row-gap: 5px;

  &:hover {
    color: initial;
    background-color: initial;
  }
`;

export const MenuItem = styled(MenuListItem)`
  display: grid;
  grid-template-columns: 50px max-content;
  justify-content: start;

  &:hover {
    cursor: pointer;
  }
`;

export const MenuSideBar = styled.div`
  display: grid;
  align-content: center;
  grid-template-columns: max-content max-content;
  grid-template-rows: 100%;
  column-gap: 6px;
  height: 100%;
  width: 100%;
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(180deg);
  padding: 8px 0;
  font-family: Aharoni, Helvetica, sans-serif;
  font-weight: 900;
  font-size: 28px;
  color: ${({ theme }) => theme.flatLight};
  background-color: ${({ theme }) => theme.flatDark};

  & > span {
    display: flex;
    align-items: center;
    width: 100%;
  }

  & > span:last-child {
    letter-spacing: -2px;
    font-weight: 200;
  }
`;
