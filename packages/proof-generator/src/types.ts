export type Proof = object;

export type CircuitInput = {
  root: string; //bigint-String 31 bytes little-endian
  nullifierHash: string; // base10-String 31 bytes little-endian
  recipient: string; // blake-224 to base10-string
  relayer: string; // blake-224 to base10-string
  fee: string; // lovelace

  // private part
  nullifier: number[]; // 248-bit array
  secret: number[]; // 248-bit array
  pathElements: number[][]; // array of 256-bit arrays *SHA-ARRAY*
  pathIndices: number[]; // binary index power of 2
};
