import { z } from 'zod';
import axios from 'axios';
import {
  GetUTxOsResponse,
  ChainTip,
  DatumResponse,
  ProtocolParametersResponse,
  TxStatusResponse,
} from './types';
import { Observable, from, map, switchMap } from 'rxjs';
import { ChainIndexProvider, UTxO } from '../types';

export function mkKoiosProvider(baseURL: string): ChainIndexProvider {
  const http = axios.create({
    baseURL,
    headers: {
      ['accept']: 'application/json',
      ['content-type']: 'application/json',
    },
  });

  const getTip = () =>
    from(http.get('/tip')).pipe(map((res) => ChainTip.parse(res.data)));

  const getUTxOs = (address: string): Observable<UTxO[]> => {
    return from(http.post('address_info', { _addresses: [address] })).pipe(
      map((res) => GetUTxOsResponse.parse(res.data))
    );
  };
  return {
    getProtocolParameters: () =>
      getTip().pipe(
        switchMap(({ epoch }) =>
          from(http.get(`/epoch_params?_epoch_no=${epoch}`))
        ),
        map((res) => ProtocolParametersResponse.parse(res.data))
      ),
    getUTxOs,
    getDatum: (datumHash: string): Observable<string> =>
      from(
        http
          .post('datum_info', { _datum_hashes: [datumHash] })
          .then((value) => DatumResponse.parse(value.data))
      ),
    getTxsInfo: (txHashes: string[]) =>
      from(http.post('tx_status', { _tx_hashes: txHashes })).pipe(
        map((res) => TxStatusResponse.parse(res.data))
      ),
    submitTx: (tx: string) => {
      const headers = { 'Content-Type': 'application/cbor' };

      return from(http.post('submittx', toBytes(tx), { headers })).pipe(
        map((res) => z.string().parse(res.data))
      );
    },
  };
}

const toBytes = (str: string): Uint8Array => {
  if (str.length % 2 === 0 && /^[0-9A-F]*$/i.test(str))
    return Buffer.from(str, 'hex');

  return Buffer.from(str, 'utf-8');
};
