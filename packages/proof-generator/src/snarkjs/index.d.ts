export const groth16: {
  fullProve<PS>(
    input: any,
    wasmFile: Uint8Array,
    zkeyFile: Uint8Array,
    logger?: {
      error: (msg: string) => void;
      info: (msg: string) => void;
      log: (msg: string) => void;
      debug: (msg: string) => void;
    }
  ): Promise<{
    proof: {
      pi_a: string[];
      pi_b: string[][];
      pi_c: string[][];
      protocol: 'groth16';
      curve: string;
    };
    publicSignals: PS;
  }>;
  verify(vKey: object, publicSignals: any, proof: any): Promise<any>;
};
