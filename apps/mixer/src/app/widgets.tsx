import { WidgetConfig } from '@mixer/desktop';
import { MixerIcon, CustomizeIcon } from '@mixer/icons';
import { injectable } from '@mixer/injectable';
import { mkMixer } from '@mixer/mixer';
import { mkCustomizer } from '@mixer/customizer';

export const mkWidgetsConfig = injectable(
  mkMixer,
  mkCustomizer,
  (Mixer, Customizer): WidgetConfig[] => [
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
  ]
);
