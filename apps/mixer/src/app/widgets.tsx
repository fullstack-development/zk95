import { WidgetConfig } from '@mixer/desktop';
import { MixerIcon, CustomizeIcon, SearchIcon } from '@mixer/icons';
import { injectable } from '@mixer/injectable';
import { mkMixer } from '@mixer/mixer';
import { mkCustomizer } from '@mixer/customizer';
import { mkTransactionWatcher } from '@mixer/transaction-watcher';
import { combineEff } from '@mixer/utils';

export const mkWidgetsConfig = injectable(
  mkMixer,
  mkCustomizer,
  mkTransactionWatcher,
  combineEff((Mixer, Customizer, Watcher): WidgetConfig[] => [
    {
      id: 'mixer',
      caption: 'mixer.exe',
      iconSrc: MixerIcon,
      defaultSize: { width: 500, height: 400 },
      Component: Mixer,
    },
    {
      id: 'appearance',
      caption: 'Appearance',
      iconSrc: CustomizeIcon,
      defaultSize: { width: 500, height: 440 },
      Component: Customizer,
    },
    {
      id: 'transactions',
      caption: 'My Transactions',
      iconSrc: SearchIcon,
      defaultSize: { width: 520, height: 240 },
      Component: Watcher,
    },
  ])
);
