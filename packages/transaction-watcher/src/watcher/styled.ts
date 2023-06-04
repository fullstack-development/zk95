import { ScrollView as React95ScrollView } from 'react95';
import styled from 'styled-components';

export const Content = styled.section`
  height: 100%;
  background-color: ${({ theme }) => theme.canvas};
`;

export const ScrollView = styled(React95ScrollView)`
  height: 100%;
`;

export const TxItem = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: center;
  height: 36px;
`;

export const TxStatusIcon = styled.div`
  display: grid;
  justify-content: center;
  align-items: center;
`;

export const TxHash = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
`;
