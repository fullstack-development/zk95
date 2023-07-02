import { fromHex } from '@mixer/crypto';

/**
 *
 * @param note
 * @returns [poolSize, nullifier, secret]
 */
export function parseNote(note: string): [string, Uint8Array, Uint8Array] {
  const [, poolSize, nullifierSecretHex] = note.split('-');
  const nullifierHex = nullifierSecretHex.substring(0, 62);
  const secretHex = nullifierSecretHex.substring(62);
  return [poolSize, fromHex(nullifierHex), fromHex(secretHex)];
}
