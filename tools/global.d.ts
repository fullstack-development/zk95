import 'styled-components';
import { Theme } from 'react95/dist/themes/types';

declare module '*.png';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

declare global {
  interface Window {
    cardano: Cardano;
  }
}

type WalletApi = {
  name: string;
  icon: string;
  apiVersion: string;
  isEnabled: () => Promise<boolean>;
};

declare type Cardano = {
  [key: string]: {
    name: string;
    icon: string;
    apiVersion: string;
    isEnabled: () => Promise<boolean>;
  };
};
