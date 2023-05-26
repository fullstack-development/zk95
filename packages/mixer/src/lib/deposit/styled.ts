import { GroupBox } from 'react95';
import styled from 'styled-components';

export const DepositFormContent = styled.section`
  display: grid;
  height: 100%;
  align-content: space-between;
  grid-template-rows: max-content 50px;
`;

export const FormFooter = styled.div`
  display: grid;
  justify-items: end;
  align-items: end;
`;

export const PoolsBox = styled(GroupBox)`
  display: grid;
  grid-auto-flow: column;
`;
