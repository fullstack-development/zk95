import {
  shareReplay,
  throttle,
  timer,
  from,
  switchMap,
  map,
  of,
  tap,
  scan,
  last,
  Observable,
  ReadableStreamLike,
} from 'rxjs';
import { decompress } from 'fflate';
import { fromFetch } from 'rxjs/fetch';

import { injectable, token } from '@mixer/injectable';

import {
  ProgressStatus,
  ZKeyStorageAPI,
  ZKeyLoader,
  ZKeyConfig,
} from './types';
import { newAtom } from '@frp-ts/core';
import { withEff } from '@mixer/eff';

const DB_NAME = 'appDB';
const STORAGE_NAME = 'zKey';

export const Z_KEY_CONFIG_KEY = 'zKeyConfig';
export const mkZKeyLoader = injectable(
  token(Z_KEY_CONFIG_KEY)<ZKeyConfig>(),
  (config) => {
    const progressStatus$ = newAtom<ProgressStatus>({
      type: 'not initiated',
    });
    const zKeyDB = mkZKeyStorage(DB_NAME, config.version).pipe(shareReplay(1));

    const loadZKeyEffect$ = zKeyDB.pipe(
      tap({ next: () => progressStatus$.set({ type: 'initiated' }) }),
      switchMap((db) =>
        db
          .getZKey()
          .pipe(
            switchMap((zKey) =>
              zKey ? of(STORAGE_NAME) : loadAndStoreZKey(db)
            )
          )
      ),
      tap({
        complete: () => progressStatus$.set({ type: 'success' }),
        error: (error) => progressStatus$.set({ type: 'failed', error }),
      })
    );

    return withEff<ZKeyLoader>(
      {
        progressStatus$,
        getZKey: () => zKeyDB.pipe(switchMap((db) => db.getZKey())),
      },
      loadZKeyEffect$
    );

    function loadAndStoreZKey(db: ZKeyStorageAPI) {
      return fromFetch(config.url).pipe(
        switchMap((r) =>
          r.body === null
            ? from(r.arrayBuffer()).pipe(map((ab) => new Uint8Array(ab)))
            : processStream(r.body, Number(r.headers.get('Content-Length')))
        ),
        tap({
          complete: () => progressStatus$.set({ type: 'decompressing' }),
        }),
        switchMap((buffer) => decompressZKey(buffer)),
        switchMap((zKey) => db.addZKey(zKey))
      );
    }

    function processStream(stream: ReadableStream<Uint8Array>, length: number) {
      return from(stream as ReadableStreamLike<Uint8Array>).pipe(
        scan<Uint8Array, [number, Uint8Array[]]>(
          ([loaded, chunks], chunk) => {
            chunks.push(chunk);
            return [loaded + chunk.length, chunks];
          },
          [0, []]
        ),
        throttle(() => timer(100), { trailing: true }),
        tap({
          next: ([loaded]) =>
            progressStatus$.set({
              type: 'loading',
              progress: Math.floor((loaded / length) * 100),
            }),
        }),
        last(),
        map(([, chunks]) => new Blob(chunks, { type: 'application/gz' })),
        switchMap((blob) => blob.arrayBuffer()),
        map((ab) => new Uint8Array(ab))
      );
    }
  }
);

function mkZKeyStorage(
  name: string,
  version?: number
): Observable<ZKeyStorageAPI> {
  return new Observable((subscriber) => {
    const openRequest = indexedDB.open(name, version);

    const teardown = () => {
      openRequest.removeEventListener('success', handleSuccess);
      openRequest.removeEventListener('error', handleError);
      openRequest.removeEventListener('upgradeneeded', handleUpgrade);
      subscriber.complete();
    };

    const handleSuccess = () => {
      subscriber.next(mkDbAPI(openRequest.result));
      teardown();
    };

    const handleError = () => {
      subscriber.error(openRequest.error);
      teardown();
    };

    const handleUpgrade = () => {
      if (!openRequest.result.objectStoreNames.contains(STORAGE_NAME)) {
        openRequest.result.createObjectStore(STORAGE_NAME, {
          autoIncrement: false,
        });
      } else {
        openRequest.result
          .transaction(STORAGE_NAME, 'readwrite')
          .objectStore(STORAGE_NAME)
          .clear();
      }
    };

    openRequest.addEventListener('success', handleSuccess);
    openRequest.addEventListener('error', handleError);
    openRequest.addEventListener('upgradeneeded', handleUpgrade);

    return teardown;
  });
}

function mkDbAPI(db: IDBDatabase): ZKeyStorageAPI {
  return {
    addZKey: (zKey: Uint8Array) =>
      new Observable((subscriber) => {
        const transaction = db.transaction(STORAGE_NAME, 'readwrite');
        const store = transaction.objectStore(STORAGE_NAME);
        const request = store.add(zKey, STORAGE_NAME);
        const teardown = () => {
          request.removeEventListener('success', handleSuccess);
          request.removeEventListener('error', handleError);
          subscriber.complete();
        };

        const handleSuccess = () => {
          subscriber.next(request.result);
          teardown();
        };

        const handleError = () => {
          subscriber.error(request.error);
          teardown();
        };

        request.addEventListener('success', handleSuccess);
        request.addEventListener('error', handleError);

        return teardown;
      }),
    getZKey: () =>
      new Observable((subscriber) => {
        const transaction = db.transaction(STORAGE_NAME);
        const store = transaction.objectStore(STORAGE_NAME);
        const request = store.get(STORAGE_NAME);
        const teardown = () => {
          request.removeEventListener('success', handleSuccess);
          request.removeEventListener('error', handleError);
          subscriber.complete();
        };

        const handleSuccess = () => {
          subscriber.next(request.result);
          teardown();
        };

        const handleError = () => {
          subscriber.error(request.error);
          teardown();
        };

        request.addEventListener('success', handleSuccess);
        request.addEventListener('error', handleError);

        return teardown;
      }),
  };
}

function decompressZKey(buffer: Uint8Array) {
  return new Promise<Uint8Array>((res, rej) => {
    decompress(buffer, (error, result) => {
      if (error) {
        rej(error);
      } else {
        res(result);
      }
    });
  });
}
