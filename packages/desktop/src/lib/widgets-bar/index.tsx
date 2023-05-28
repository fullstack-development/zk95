import { injectable } from '@mixer/injectable';
import { useProperties } from '@frp-ts/react';
import { mkDesktopModel } from '../model';
import { Toolbar, Button } from './styled';

export const mkWidgetBar = injectable(
  mkDesktopModel,
  ({ activeWidgetId$, activeWidgets$, makeWidgetActive }) =>
    () => {
      const [activeWidgets, activeWidgetId] = useProperties(
        activeWidgets$,
        activeWidgetId$
      );

      return (
        <Toolbar>
          {Object.values(activeWidgets).map(({ caption, iconSrc, id }) => (
            <Button
              active={id === activeWidgetId}
              onMouseDown={() => makeWidgetActive(id)}
            >
              <img src={iconSrc} alt="i" width={20} height={20} />
              {caption}
            </Button>
          ))}
        </Toolbar>
      );
    }
);
