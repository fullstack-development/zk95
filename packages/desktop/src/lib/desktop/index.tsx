import { useProperties } from '@frp-ts/react';
import Draggable from 'react-draggable';

import { injectable } from '@mixer/injectable';
import { Window } from '@mixer/components';
import { useClickOutside } from '@mixer/utils';
import { mkCustomizeModel } from '@mixer/customizer';

import { WidgetConfig, Widget, mkDesktopModel, DesktopModel } from '../model';
import { WidgetIcon } from '../widget-icon';
import {
  DesktopDraggableArea,
  DesktopDraggableItem,
  DesktopGrid,
  DesktopManagerContent,
} from './styled';

type Props = {
  widgetsConfig: WidgetConfig[];
};

export const mkDesktop = injectable(
  mkDesktopModel,
  mkCustomizeModel,
  (model, { selectedTheme$ }) =>
    ({ widgetsConfig }: Props) => {
      const { activeWidgets$, openWidget } = model;
      const [activeWidgets, selectedThemeKey] = useProperties(
        activeWidgets$,
        selectedTheme$
      );

      // useEffect(() => {
      //   openWidget(widgetsConfig[2]);
      // }, []);

      return (
        <DesktopManagerContent id="desktop">
          <DesktopDraggableArea>
            {Object.values(activeWidgets).map((widget) => (
              <DraggableWidget key={widget.id} widget={widget} model={model} />
            ))}
          </DesktopDraggableArea>
          <DesktopGrid>
            {widgetsConfig.map((widget) => (
              <WidgetIcon
                key={widget.id}
                iconSrc={widget.iconSrc}
                caption={widget.caption}
                themeKey={selectedThemeKey}
                onDoubleClick={() => openWidget(widget)}
              />
            ))}
          </DesktopGrid>
        </DesktopManagerContent>
      );
    }
);

function DraggableWidget({
  widget,
  model,
}: {
  widget: Widget;
  model: DesktopModel;
}) {
  const [activeWidgetId, widgetsOrder] = useProperties(
    model.activeWidgetId$,
    model.widgetsOrder$
  );
  const nodeRef = useClickOutside<HTMLDivElement>(model.blur);
  const handleId = 'handle';
  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="#desktop"
      handle={`#${handleId}`}
      axis="both"
      defaultPosition={{ x: 80, y: 80 }}
      onMouseDown={() => model.makeWidgetActive(widget.id)}
      scale={1}
    >
      <DesktopDraggableItem
        ref={nodeRef}
        style={widget.defaultSize}
        order={widgetsOrder[widget.id]}
      >
        <Window
          id={handleId}
          title={widget.caption}
          iconSrc={widget.iconSrc}
          active={activeWidgetId === widget.id}
          onClose={() => model.closeWidget(widget.id)}
        >
          <widget.Component />
        </Window>
      </DesktopDraggableItem>
    </Draggable>
  );
}
