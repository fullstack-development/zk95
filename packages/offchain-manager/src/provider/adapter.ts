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
}
