import { ChainIndexProvider } from '@mixer/chain-index-provider';
import { Provider, Blockfrost } from 'lucid-cardano';
const noop = () => {
  throw new Error('not implemented');
};

export function mkProviderAdapter(_provider: ChainIndexProvider): Provider {
  const provider = new Blockfrost(
    process.env['NX_PROVIDER_URL'] ?? '',
    process.env['NX_PROVIDER_API_KEY']
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
