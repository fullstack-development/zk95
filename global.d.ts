// import 'styled-components';
// import { Theme } from 'react95/dist/themes/types';

declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*.wasm' {
  const src: ArrayBuffer;
  export default src;
}

// declare module 'styled-components' {
//   export interface DefaultTheme extends Theme {}
// }
