import styled from 'styled-components';

export const WithdrawForm = styled.form`
  display: grid;
  grid-template-rows: 1fr max-content;
  row-gap: 24px;
  height: 100%;
`;

export const Fieldset = styled.fieldset`
  display: grid;
  grid-template-rows: max-content max-content;
  row-gap: 24px;
`;

export const Field = styled.div`
  display: grid;
  grid-template-rows: max-content max-content;
  row-gap: 4px;
`;

export const Footer = styled.footer`
  display: grid;
  justify-items: end;
  align-items: end;
`;
