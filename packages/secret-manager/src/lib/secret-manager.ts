import { injectable } from '@mixer/injectable';
import { defer, from, map, Observable, of, switchMap, zip } from 'rxjs';

export type SecretManagerModel = {
  secretInfo$: Observable<{
    secret: Uint8Array;
    nullifier: Uint8Array;
    commitmentHash: Uint8Array;
  }>;
  mkCommitmentHash: (
    nullifier: Uint8Array,
    secret: Uint8Array
  ) => Observable<Uint8Array>;
  hash: (value: Uint8Array) => Observable<Uint8Array>;
};

export const mkSecretManager = injectable((): SecretManagerModel => {
  const secret$ = defer(() => of(crypto.getRandomValues(new Uint8Array(31))));
  const nullifier$ = defer(() =>
    of(crypto.getRandomValues(new Uint8Array(31)))
  );
  const secretInfo$ = zip(secret$, nullifier$).pipe(
    switchMap(([secret, nullifier]) =>
      mkCommitmentHash(nullifier, secret).pipe(
        map((commitmentHash) => ({
          secret,
          nullifier,
          commitmentHash,
        }))
      )
    )
  );

  function mkCommitmentHash(
    nullifier: Uint8Array,
    secret: Uint8Array
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
    secretInfo$,
    mkCommitmentHash,
    hash,
  };
});
