import styled from 'styled-components';

export const DesktopManagerContent = styled.div`
  overflow: hidden;
  display: grid;
  grid-auto-rows: min-content 1fr;
  justify-content: stretch;
  align-content: stretch;
  width: 100%;
  height: 100%;
`;

export const DesktopDraggableArea = styled.div`
  position: relative;
  width: 0;
  height: 0;
`;

export const DesktopDraggableItem = styled.div<{ order: number }>`
  position: absolute;
  z-index: ${({ order }) => order};
`;

export const DesktopGrid = styled.div`
  display: grid;
  padding: 20px;
  grid-auto-rows: 70px;
  grid-auto-columns: 70px;
  grid-gap: 20px;
`;
