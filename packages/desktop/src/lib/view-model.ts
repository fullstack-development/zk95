import { ComponentType } from 'react';
import { injectable } from '@mixer/injectable';
import { Property, newAtom, action } from '@frp-ts/core';
import { makeViewModel } from '@mixer/utils';

export type WidgetConfig = {
  id: string;
  caption: string;
  iconSrc: string;
  defaultSize: { width: number; height: number };
  Component: ComponentType;
};

type WidgetLayout = {
  order: number;
};

type Widget = WidgetConfig & WidgetLayout;

export type DesktopViewModel = {
  activeWidgetId$: Property<string | null>;
  activeWidgets$: Property<Record<string, Widget>>;
  openWidget: (widget: WidgetConfig) => void;
  closeWidget: (widgetId: string) => void;
  makeWidgetActive: (widgetId: string) => void;
};

export const mkDesktopViewModel = injectable(() => {
  const activeWidgets$ = newAtom<Record<string, Widget>>({});
  const activeWidgetId$ = newAtom<string | null>(null);
  const widgetsCount$ = newAtom<number>(0);

  const openWidget = (widget: WidgetConfig) => {
    const currentWidgets = activeWidgets$.get();

    if (currentWidgets[widget.id]) {
      makeWidgetActive(widget.id);
    } else {
      action(() => {
        const order = widgetsCount$.get() + 1;
        widgetsCount$.set(order);
        const activeWidget = { ...widget, order };
        activeWidgetId$.set(widget.id);
        activeWidgets$.set({ ...currentWidgets, [widget.id]: activeWidget });
      });
    }
  };

  const closeWidget = (widgetId: string) => {
    const currentWidgets = activeWidgets$.get();

    if (currentWidgets[widgetId]) {
      const { [widgetId]: _, ...newWidgets } = currentWidgets;
      activeWidgets$.set(newWidgets);
    }
  };

  function reorderWidgets(focusedWidgetId: string) {
    const currentWidgets = activeWidgets$.get();
    const currentWidgetsIds = Object.keys(activeWidgets$.get());
    const widgetCount = widgetsCount$.get();
    return currentWidgetsIds.reduce<Record<string, Widget>>((acc, widgetId) => {
      const widget = currentWidgets[widgetId];
      acc[widgetId] = {
        ...widget,
        order: widget.id === focusedWidgetId ? widgetCount : widget.order - 1,
      };

      return acc;
    }, {});
  }

  function makeWidgetActive(widgetId: string) {
    if (activeWidgetId$.get() !== widgetId) {
      activeWidgetId$.set(widgetId);
      const reorderedWidgets = reorderWidgets(widgetId);
      activeWidgets$.set(reorderedWidgets);
    }
  }

  return makeViewModel<DesktopViewModel>({
    activeWidgetId$,
    activeWidgets$,
    openWidget,
    closeWidget,
    makeWidgetActive,
  });
});
