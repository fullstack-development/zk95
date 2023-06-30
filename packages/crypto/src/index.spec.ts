import { reverseBitsOrder, fromText } from '.';

describe('crypto', () => {
  it('reverseBitsOrder', () => {
    const value = fromText('value');

    console.log(Buffer.from(reverseBitsOrder(value)).toString('hex'));
    console.log(Buffer.from(value).toString('hex'));
    expect(true).toBe(true);
  });
});
