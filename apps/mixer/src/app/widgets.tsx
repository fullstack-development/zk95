import { Customizer } from '@mixer/customizer';
import { WidgetConfig } from '@mixer/desktop';
import { MixerIcon, CustomizeIcon } from '@mixer/icons';
import { Mixer } from '@mixer/mixer';

export const WIDGETS_CONFIG: WidgetConfig[] = [
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
];
