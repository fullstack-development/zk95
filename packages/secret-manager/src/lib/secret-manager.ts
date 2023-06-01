import { injectable } from '@mixer/injectable';
import { defer, first, from, map, Observable, of, switchMap, zip } from 'rxjs';

export type SecretManagerModel = {
  getSecretInfo$: () => Observable<
    readonly [Uint8Array, Uint8Array, Uint8Array]
  >;
  mkCommitmentHash: (
    nullifier: Uint8Array,
    secret: Uint8Array
  ) => Observable<Uint8Array>;
  hash: (value: Uint8Array) => Observable<Uint8Array>;
};

export const mkSecretManager = injectable(() => {
  const secret$ = defer(() => of(crypto.getRandomValues(new Uint8Array(31))));
  const nullifier$ = defer(() =>
    of(crypto.getRandomValues(new Uint8Array(31)))
  );
  const getSecretInfo$ = () =>
    zip(secret$, nullifier$).pipe(
      first(),
      switchMap(([secret, nullifier]) =>
        mkCommitmentHash(secret, nullifier).pipe(
          map((commitmentHash) => [secret, nullifier, commitmentHash] as const)
        )
      )
    );

  function mkCommitmentHash(
    secret: Uint8Array,
    nullifier: Uint8Array
  ): Observable<Uint8Array> {
    const commitment = new Uint8Array(secret.length + nullifier.length);
    commitment.set(nullifier, 0);
    commitment.set(secret, nullifier.length);

    return hash(commitment);
  }

  function hash(value: Uint8Array) {
    return from(
      crypto.subtle.digest('SHA-256', value).then((c) => new Uint8Array(c))
    );
  }

  return {
    getSecretInfo$,
    mkCommitmentHash,
    hash,
  };
});
