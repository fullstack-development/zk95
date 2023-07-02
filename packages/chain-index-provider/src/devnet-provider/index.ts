import axios from 'axios';
import {
  Address,
  Credential,
  Datum,
  DatumHash,
  Delegation,
  OutRef,
  RewardAddress,
  Transaction,
  TxHash,
  UTxO,
  Unit,
} from 'lucid-cardano';
import { ChainIndexProvider } from '../types';

export function mkDevnetProvider(baseURL: string): ChainIndexProvider {
  const http = axios.create({
    baseURL,
    headers: {
      ['accept']: 'application/json',
      ['content-type']: 'application/json',
    },
  });

  return {
    getProtocolParameters() {
      return http
        .get('/protocol-parameters')
        .then((res) => deserialize(res.data));
    },
    async getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]> {
      return http
        .get(`/utxos/address/${JSON.stringify(addressOrCredential)}`)
        .then((res) => deserialize(res.data));
    },
    async getUtxosWithUnit(
      addressOrCredential: Address | Credential,
      unit: Unit
    ): Promise<UTxO[]> {
      return http
        .get(
          `/utxos/address/${JSON.stringify(addressOrCredential)}/unit/${unit}`
        )
        .then((res) => deserialize(res.data));
    },
    getUtxoByUnit(unit: Unit): Promise<UTxO> {
      return http
        .get(`/utxos/unit/${unit}`)
        .then((res) => deserialize(res.data));
    },
    getUtxosByOutRef(outRefs: Array<OutRef>): Promise<UTxO[]> {
      return http
        .get(`/utxos/refs/${JSON.stringify(outRefs)}`)
        .then((res) => deserialize(res.data));
    },
    getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
      return http
        .get(`/delegation/${rewardAddress}`)
        .then((res) => deserialize(res.data));
    },
    getTxsInfo(txHashes) {
      const queryHashes = [...new Set(txHashes)];
      return http
        .post(`/await`, { txHashes: queryHashes })
        .then((res) => res.data);
    },
    getDatum(datumHash: DatumHash): Promise<Datum> {
      return http.get(`/datum/${datumHash}`).then((res) => res.data);
    },
    awaitTx(txHash: TxHash): Promise<boolean> {
      return http
        .post(`/await`, { txHashes: [txHash] })
        .then((res) => res.data);
    },
    submitTx(tx: Transaction): Promise<TxHash> {
      return http.post(`/submit`, { tx }).then((res) => res.data);
    },
  };
}

const deserialize = (json: string) =>
  JSON.parse(json, (key, value) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
      return BigInt(value.substring(0, value.length - 1));
    }
    return value;
  });
