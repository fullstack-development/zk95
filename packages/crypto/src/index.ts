import hashjs from 'hash.js';

export function hash(value: string | ArrayBuffer): Uint8Array {
  return Buffer.from(hashjs.sha256().update(value).digest());
}

export function getRandomValues(bytes: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(bytes));
}

export function concatHashes(hash1: Uint8Array, hash2: Uint8Array): Uint8Array {
  return hash(Buffer.concat([hash1, hash2]));
}

export function toHex(value: Uint8Array): string {
  return Buffer.from(value).toString('hex');
}

export function fromHex(value: string): Uint8Array {
  return Buffer.from(value, 'hex');
}

export function reverseBits(
  value: Uint8Array,
  from?: number,
  to?: number
): Uint8Array {
  return Buffer.from(
    Buffer.from(value)
      .subarray(from, to)
      .reduce<number[][]>((acc, x) => {
        acc.push(toBits(x, 8));
        return acc;
      }, [])
      .flat()
      .reverse()
      .join('')
      .match(/.{8}/g)
      ?.map((x) => parseInt(x, 2)) ?? []
  );
}

function toBits(n: number, size = 0) {
  const bitmask = new Array(size + 1).join('0');
  const binaryString = n.toString(2);
  return (bitmask.slice(0, -binaryString.length) + n.toString(2))
    .split('')
    .map(Number);
}
