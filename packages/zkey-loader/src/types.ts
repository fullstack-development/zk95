import { Property } from '@frp-ts/core';
import { Observable } from 'rxjs';

export type ZKeyConfig = {
  url: string;
  version: number;
};

export type ZKeyLoader = {
  progressStatus$: Property<ProgressStatus>;
  getZKey: () => Observable<Uint8Array | undefined>;
};

type NotInitiated = {
  type: 'not initiated';
};

type Initiated = {
  type: 'initiated';
};

type Error = {
  type: 'failed';
  error: unknown;
};

type Success = {
  type: 'success';
};

type Loading = {
  type: 'loading';
  progress: number;
};

type Decompressing = {
  type: 'decompressing';
};

export type ProgressStatus =
  | NotInitiated
  | Initiated
  | Loading
  | Decompressing
  | Success
  | Error;

export type ZKeyStorageAPI = {
  getZKey: () => Observable<Uint8Array | undefined>;
  addZKey: (zKey: Uint8Array) => Observable<IDBValidKey>;
};
