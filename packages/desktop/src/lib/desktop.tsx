import { runDeps, useDependency } from '@mixer/react-injectable';
import { useProperties } from '@frp-ts/react';

import { Window } from '@mixer/components';

import {
  WidgetConfig,
  desktopViewModelToken,
  mkDesktopViewModel,
} from './view-model';
import {
  DesktopDraggableArea,
  DesktopDraggableItem,
  DesktopGrid,
  DesktopManagerContent,
} from './styled';
import { WidgetIcon } from './widget-icon';
import Draggable from 'react-draggable';

type Props = {
  widgetsConfig: WidgetConfig[];
};

export function DesktopComponent({ widgetsConfig }: Props) {
  const {
    activeWidgetId$,
    activeWidgets$,
    openWidget,
    closeWidget,
    makeWidgetActive,
  } = useDependency(desktopViewModelToken);
  const [activeWidgetId, activeWidgets] = useProperties(
    activeWidgetId$,
    activeWidgets$
  );
  return (
    <DesktopManagerContent>
      <DesktopDraggableArea>
        {Object.values(activeWidgets).map(
          ({ Component, caption, iconSrc, defaultSize, id, order }) => (
            <Draggable
              key={id}
              axis="both"
              handle=".handle"
              defaultPosition={{ x: 100, y: 100 }}
              scale={1}
              onMouseDown={() => makeWidgetActive(id)}
            >
              <DesktopDraggableItem style={defaultSize} order={order}>
                <Window
                  className="handle"
                  title={caption}
                  iconSrc={iconSrc}
                  active={activeWidgetId === id}
                  onClose={() => closeWidget(id)}
                >
                  <Component />
                </Window>
              </DesktopDraggableItem>
            </Draggable>
          )
        )}
      </DesktopDraggableArea>
      <DesktopGrid>
        {widgetsConfig.map((widget) => (
          <WidgetIcon
            key={widget.id}
            iconSrc={widget.iconSrc}
            caption={widget.caption}
            onDoubleClick={() => openWidget(widget)}
          />
        ))}
      </DesktopGrid>
    </DesktopManagerContent>
  );
}

export const Desktop = runDeps(mkDesktopViewModel)(DesktopComponent);
