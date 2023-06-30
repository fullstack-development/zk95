import { z } from 'zod';
import axios from 'axios';
import {
  GetUTxOsResponse,
  ChainTip,
  DatumResponse,
  ProtocolParametersResponse,
  TxStatusResponse,
} from './types';

import { ChainIndexProvider } from '../types';

export function mkKoiosProvider(baseURL: string): ChainIndexProvider {
  const http = axios.create({
    baseURL,
    headers: {
      ['accept']: 'application/json',
      ['content-type']: 'application/json',
    },
  });

  const getTip = () => http.get('/tip').then((res) => ChainTip.parse(res.data));

  const getUTxOs = (address: string) =>
    http
      .post('address_info', { _addresses: [address] })
      .then((res) => GetUTxOsResponse.parse(res.data));
  return {
    getProtocolParameters: () =>
      getTip()
        .then(({ epoch }) => http.get(`/epoch_params?_epoch_no=${epoch}`))
        .then((res) => ProtocolParametersResponse.parse(res.data)),
    getUTxOs,
    getDatum: (datumHash: string) =>
      http
        .post('datum_info', { _datum_hashes: [datumHash] })
        .then((value) => DatumResponse.parse(value.data)),
    getTxsInfo: (txHashes: string[]) =>
      http
        .post('tx_status', { _tx_hashes: txHashes })
        .then((res) => TxStatusResponse.parse(res.data)),
    submitTx: (tx: string) => {
      const headers = { 'Content-Type': 'application/cbor' };
      return http
        .post('submittx', toBytes(tx), { headers })
        .then((res) => z.string().parse(res.data));
    },
  };
}

const toBytes = (str: string): Uint8Array => {
  if (str.length % 2 === 0 && /^[0-9A-F]*$/i.test(str))
    return Buffer.from(str, 'hex');

  return Buffer.from(str, 'utf-8');
};
