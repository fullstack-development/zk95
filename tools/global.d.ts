import 'styled-components';
import { Theme } from 'react95/dist/themes/types';

declare module '*.png';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
