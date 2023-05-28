import styled from 'styled-components';

type Props = {
  iconSrc: string;
  caption: string;
  onDoubleClick: () => void;
};

export const WidgetIcon = ({ iconSrc, caption, onDoubleClick }: Props) => {
  return (
    <WidgetIconButton tabIndex={1} onDoubleClick={onDoubleClick}>
      <img src={iconSrc} alt="icon" />
      <WidgetIconCaption>{caption}</WidgetIconCaption>
    </WidgetIconButton>
  );
};

const WidgetIconCaption = styled.span`
  &:focus {
    outline: rgb(0, 0, 0) dotted 1px;
  }
`;

const WidgetIconButton = styled.button`
  display: grid;
  justify-items: center;
  background: none;
  border: none;
  padding: 3px;
  cursor: pointer;
  color: ${({ theme }) => theme.canvasTextInvert};

  &:focus > ${WidgetIconCaption} {
    outline: rgb(0, 0, 0) dotted 1px;
  }
`;
