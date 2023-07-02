import hashjs from 'hash.js';

export function hash(value: string | ArrayBuffer): Uint8Array {
  return Buffer.from(hashjs.sha256().update(value).digest());
}

export function getRandomValues(bytes: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(bytes));
}

export function hashConcat(...values: Uint8Array[]): Uint8Array {
  return hash(Buffer.concat(values));
}

export function toHex(value: Uint8Array): string {
  return Buffer.from(value).toString('hex');
}

export function toBigInt(value: Uint8Array | string): bigint {
  return BigInt('0x' + (typeof value === 'string' ? value : toHex(value)));
}

export function fromBigInt(value: bigint): Uint8Array {
  return Buffer.from(value.toString(16), 'hex');
}

export function fromHex(value: string): Uint8Array {
  return Buffer.from(value, 'hex');
}

export function fromText(value: string): Uint8Array {
  return Buffer.from(value, 'utf-8');
}

export function toBits(value: Uint8Array): number[] {
  const bits = [];

  for (let i = 0; i < value.length; i++) {
    const byte = value[i];

    for (let j = 7; j >= 0; j--) {
      const bit = (byte >> j) & 1;
      bits.push(bit);
    }
  }

  return bits;
}

export function fromBits(bits: number[]): Uint8Array {
  const buffer = new Uint8Array(Math.ceil(bits.length / 8));

  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i];
    const byteIndex = Math.floor(i / 8);
    const bitIndex = 7 - (i % 8);
    buffer[byteIndex] |= bit << bitIndex;
  }

  return buffer;
}

export function reverseBitsOrder(value: Uint8Array) {
  return fromBits(toBits(value).reverse());
}
