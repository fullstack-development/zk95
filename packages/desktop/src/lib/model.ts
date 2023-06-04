import { ComponentType } from 'react';
import { injectable, token } from '@mixer/injectable';
import { Property, newAtom, combine } from '@frp-ts/core';

export type WidgetConfig = {
  id: string;
  caption: string;
  iconSrc: string;
  defaultSize: { width: number; height: number };
  Component: ComponentType;
};

export type Widget = WidgetConfig;

export type DesktopModel = {
  activeWidgetId$: Property<string | null>;
  activeWidgets$: Property<Record<string, Widget>>;
  widgetsOrder$: Property<Record<string, number>>;
  openWidget: (widget: WidgetConfig) => void;
  closeWidget: (widgetId: string) => void;
  makeWidgetActive: (widgetId: string) => void;
  blur: () => void;
};

export const WIDGET_CONFIG_TOKEN = token('widgetConfig')<WidgetConfig[]>();

export const mkDesktopModel = injectable(() => {
  const activeWidgets$ = newAtom<Record<string, Widget>>({});
  const activeWidgetId$ = newAtom<string | null>(null);
  const widgetsOrder$ = combine(
    activeWidgets$,
    activeWidgetId$,
    (activeWidgets, activeWidgetId) => {
      const currentWidgetsIds = Object.keys(activeWidgets);

      if (activeWidgetId) {
        const order = currentWidgetsIds.indexOf(activeWidgetId);
        if (order > -1) {
          currentWidgetsIds.splice(order, 1);
          currentWidgetsIds.push(activeWidgetId);
        }
      }

      return currentWidgetsIds.reduce<Record<string, number>>(
        (acc, id, idx) => {
          acc[id] = idx;
          return acc;
        },
        {}
      );
    }
  );
  const openWidget = (widget: WidgetConfig) => {
    const currentWidgets = activeWidgets$.get();

    if (!currentWidgets[widget.id]) {
      activeWidgets$.set({ ...currentWidgets, [widget.id]: widget });
    }
    makeWidgetActive(widget.id);
  };

  const closeWidget = (widgetId: string) => {
    const currentWidgets = activeWidgets$.get();

    if (currentWidgets[widgetId]) {
      const { [widgetId]: _, ...newWidgets } = currentWidgets;
      activeWidgets$.set(newWidgets);
    }
  };
  function makeWidgetActive(widgetId: string | null) {
    if (activeWidgetId$.get() !== widgetId) {
      activeWidgetId$.set(widgetId);
    }
  }

  return {
    activeWidgetId$,
    activeWidgets$,
    widgetsOrder$,
    openWidget,
    closeWidget,
    makeWidgetActive,
    blur: () => activeWidgetId$.set(null),
  };
});
