import { ChainIndexProvider } from '@mixer/chain-index-provider';
import { Address, Credential, C, Provider, Blockfrost } from 'lucid-cardano';
import { firstValueFrom } from 'rxjs';
const noop = () => {
  throw new Error('not implemented');
};

export function mkProviderAdapter(_provider: ChainIndexProvider): Provider {
  const provider = new Blockfrost(
    'https://cardano-preprod.blockfrost.io/api/v0',
    'preprodZpZ9X9GL1xL5vajWd8VNxHxcTyYoMePJ'
  );

  return {
    getProtocolParameters: () => {
      return provider.getProtocolParameters().then((data) => ({
        ...data,
        maxTxExMem: data.maxTxExMem * BigInt(10),
      }));
    },
    getUtxos: (...args) => provider.getUtxos(...args),
    getUtxosWithUnit: noop,
    getUtxoByUnit: noop,
    getUtxosByOutRef: noop,
    getDelegation: noop,
    getDatum: (...args) => provider.getDatum(...args),
    awaitTx: noop,
    submitTx: (...args) => provider.submitTx(...args),
  };

  // {
  //   getProtocolParameters: () =>
  //     firstValueFrom(provider.getProtocolParameters()),
  //   getUtxos: (addressOrCredential: Address | Credential) => {
  //     const address = (() => {
  //       if (typeof addressOrCredential === 'string') return addressOrCredential;
  //       const credentialBech32 =
  //         addressOrCredential.type === 'Key'
  //           ? C.Ed25519KeyHash.from_hex(addressOrCredential.hash).to_bech32(
  //               'addr_vkh'
  //             )
  //           : C.ScriptHash.from_hex(addressOrCredential.hash).to_bech32(
  //               'addr_vkh'
  //             );
  //       return credentialBech32;
  //     })();
  //     return firstValueFrom(provider.getUTxOs(address));
  //   },
  //   getUtxosWithUnit: noop,
  //   getUtxoByUnit: noop,
  //   getUtxosByOutRef: noop,
  //   getDelegation: noop,
  //   getDatum: (...args) => firstValueFrom(provider.getDatum(...args)),
  //   awaitTx: noop,
  //   submitTx: (...args) => firstValueFrom(provider.submitTx(...args)),
  // };
}
