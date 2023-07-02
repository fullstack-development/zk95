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
  height: 36px;
  grid-auto-flow: column;
  grid-auto-columns: 1fr max-content;
  column-gap: 10px;
  justify-items: end;
  align-items: end;
`;

export const ProgressContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const ProgressValue = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  align-items: center;
  justify-items: center;
`;
