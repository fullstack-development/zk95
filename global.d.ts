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

declare module 'snarkjs' {
  export const groth16: {
    fullProve(
      input: any,
      wasmFile: Uint8Array,
      zkeyFile: Uint8Array,
      logger?: {
        error: (msg: string) => void;
        info: (msg: string) => void;
        log: (msg: string) => void;
        debug: (msg: string) => void;
      }
    ): Promise<{ proof: any; publicSignals: any[] }>;
    verify(vKey: object, publicSignals: any, proof: any): Promise<any>;
  };
}

// declare module 'styled-components' {
//   export interface DefaultTheme extends Theme {}
// }
