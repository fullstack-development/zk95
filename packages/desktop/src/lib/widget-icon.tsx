import styled from 'styled-components';

type Props = {
  iconSrc: string;
  caption: string;
  themeKey: string;
  onDoubleClick: () => void;
};

export const WidgetIcon = ({
  iconSrc,
  caption,
  themeKey,
  onDoubleClick,
}: Props) => {
  return (
    <WidgetIconButton tabIndex={1} onDoubleClick={onDoubleClick}>
      <Icon src={iconSrc} alt="icon" />
      <WidgetIconCaption themeKey={themeKey}>{caption}</WidgetIconCaption>
    </WidgetIconButton>
  );
};

const Icon = styled.img``;

const WidgetIconCaption = styled.span<{ themeKey: string }>`
  color: ${({ themeKey, theme }) =>
    themeKey === 'original' || themeKey === 'ash'
      ? theme.canvasTextInvert
      : theme.materialText};
  font-family: 'ms_sans_serif';
`;

const WidgetIconButton = styled.button`
  display: grid;
  justify-items: center;
  background: none;
  border: none;
  padding: 3px;
  font-size: 14px;
  cursor: pointer;

  &:focus > ${WidgetIconCaption} {
    color: ${({ theme }) => theme.materialTextInvert};
    outline: ${({ theme }) => theme.focusSecondary} dotted 1px;
    background-color: ${({ theme }) => theme.hoverBackground};
  }
`;
