import styled from 'styled-components';

export const Popup = styled.div`
  width: 100px;
  height: 100px;
  padding: 1rem;
  border: 2px solid rgb(10, 10, 10);
  color: rgb(10, 10, 10);
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.tooltip};
  filter: drop-shadow(rgba(0, 0, 0, 0.55) 4px 4px 8px);
`;
