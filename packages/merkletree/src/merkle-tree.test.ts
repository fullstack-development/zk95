import { toHex, concatHashes, hash } from '@mixer/hash';
import { MerkleTree } from './merkle-tree';
const zeroValue = 'zeroValue';

/**
 * depth = 3
 * maxLeafs = 4
 *        H
 *      /   \
 *     H     H
 *    / \   / \
 *   1   2 0   0
 */

const leaf1 = hash('one');
const leaf2 = hash('two');
const leaf3 = hash(zeroValue);
const leaf4 = hash(zeroValue);

const layer2node1 = concatHashes(leaf1, leaf2);
const layer2node2 = concatHashes(leaf3, leaf4);

const rootHash = concatHashes(layer2node1, layer2node2);

describe('Merkle Tree', () => {
  //
});
