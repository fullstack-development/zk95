import { Observable, from, switchMap, tap, throwError } from 'rxjs';

import { injectable } from '@mixer/injectable';
import { MerkleTree } from '@mixer/merkletree';
import {
  reverseBitsOrder,
  toBigInt,
  toBits,
  hash,
  hashConcat,
} from '@mixer/crypto';
import { Property, newAtom } from '@frp-ts/core';
import { combineEff } from '@mixer/eff';
import { mkZKeyLoader } from '@mixer/zkey-loader';

import snarkjs from './snarkjs';
import circuit from './circuit.wasm';
import { CircuitInput, Proof } from './types';
import { assert } from '@mixer/utils';

export type ProofGeneratorService = {
  generationStep$: Property<number | null>;
  generate$(
    nullifier: Uint8Array,
    secret: Uint8Array,
    tree: MerkleTree,
    recipientAddressHex: string
  ): Observable<Proof>;
};

export const mkProofGenerator = injectable(
  mkZKeyLoader,
  combineEff(({ getZKey }): ProofGeneratorService => {
    const generationStep$ = newAtom<number | null>(null); // max 918 steps

    const generationHooks = {
      error: console.error,
      info: () => generationStep$.modify((v) => (v ?? 0) + 1),
      log: () => generationStep$.modify((v) => (v ?? 0) + 1),
      debug: () => generationStep$.modify((v) => (v ?? 0) + 1),
    };
    return {
      generationStep$,
      generate$: (nullifier, secret, tree, recipientAddressHex) => {
        const commitment = hashConcat(nullifier, secret);
        const merkleProof = tree.buildProof(commitment);

        assert('Commitment is not int the tree', merkleProof.nodes.length > 0);

        const circuitInput: CircuitInput = {
          root: toBigInt(reverseBitsOrder(tree.root.slice(0, 31))).toString(),
          nullifierHash: toBigInt(
            reverseBitsOrder(hash(nullifier).slice(0, 31))
          ).toString(),
          fee: '2000000',
          relayer:
            '7115327617372227038038094827163194829145401151534469365083940078405',
          recipient: toBigInt(recipientAddressHex).toString(),
          nullifier: toBits(nullifier),
          secret: toBits(secret),
          pathElements: merkleProof.nodes.map(toBits),
          pathIndices: merkleProof.path,
        };

        return getZKey().pipe(
          switchMap((zKey) =>
            zKey
              ? from(
                  snarkjs.groth16.fullProve<Proof['publicSignals']>(
                    circuitInput,
                    new Uint8Array(circuit),
                    zKey,
                    generationHooks
                  )
                ).pipe(
                  tap({
                    complete: () => generationStep$.set(0),
                  })
                )
              : throwError(() => new Error('ZKey is not loaded'))
          )
        );
      },
    };
  })
);
