import { toHex, concatHashes, hash } from '@mixer/hash';
import { mkMerkleTree, isNode, UncompletedMerkleTree } from './merkle-tree';
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
  describe('leafsCount', () => {
    it('must count number of leafs', () => {
      const mt1 = mkMerkleTree({ leafs: [], zeroValue });
      const mt2 = mkMerkleTree({ leafs: [], depth: 2, zeroValue });
      const mt3 = mkMerkleTree({ leafs: [], depth: 3, zeroValue });
      const mt4 = mkMerkleTree({ leafs: [], depth: 4, zeroValue });

      expect(mt1.leafsCount).toBe(2 ** 0);
      expect(mt2.leafsCount).toBe(2 ** 1);
      expect(mt3.leafsCount).toBe(2 ** 2);
      expect(mt4.leafsCount).toBe(2 ** 3);
    });
  });

  describe('mkMerkleTree', () => {
    it('must create uncompleted tree with only one leaf with hashed zero value and the leaf is root', () => {
      const mt = mkMerkleTree({ leafs: [], zeroValue });
      console.log(toHex(hash(zeroValue)));
      expect(isNode(mt.root)).toBeFalsy();
      expect(mt.completed).toBeFalsy();
      expect(toHex(mt.root.hash)).toBe(toHex(hash(zeroValue)));
    });

    it('must create uncompleted tree with given depth and fill all leafs with hashed zero value', () => {
      const mt = mkMerkleTree({ leafs: [], depth: 6, zeroValue });
      const hashes = mt.getLeafs().map((leaf) => toHex(leaf.hash));

      expect(hashes.every((h) => h === toHex(hash(zeroValue)))).toBeTruthy();
    });

    it('must create uncompleted tree with given depth and leafs, hash the leafs and fill the rest with hashed zero value', () => {
      const mt = mkMerkleTree({ leafs: ['asd', 'qwe'], depth: 6, zeroValue });
      const hashes = mt.getLeafs().map((leaf) => toHex(leaf.hash));

      expect(mt.completed).toBeFalsy();
      expect(
        hashes.every((h, idx) => {
          if (idx === 0) {
            return h === toHex(hash('asd'));
          }

          if (idx === 1) {
            return h === toHex(hash('qwe'));
          }

          return h === toHex(hash(zeroValue));
        })
      ).toBeTruthy();
    });

    it('must create completed tree with given leafs if number of leafs is power of 2', () => {
      const leafs = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const mt = mkMerkleTree({ leafs, zeroValue });
      const givenHashedLeafs = leafs.map((leaf) => toHex(hash(leaf)));
      const hashedLeafs = mt.getLeafs().map((leaf) => toHex(leaf.hash));

      expect(mt.completed).toBeTruthy();
      expect(
        hashedLeafs.every((hash, idx) => givenHashedLeafs[idx] === hash)
      ).toBeTruthy();
    });

    it('must ignore leafs that are zero values', () => {
      const leafs = [
        zeroValue,
        zeroValue,
        zeroValue,
        zeroValue,
        zeroValue,
        zeroValue,
        zeroValue,
        zeroValue,
      ];
      const mt = mkMerkleTree({ leafs, zeroValue });

      console.log(mt);
      console.log(toHex(hash(zeroValue)));
      console.log(mt.getLeafs().map((leaf) => toHex(leaf.hash)));

      expect(
        mt.completed === false &&
          mt
            .getLeafs()
            .every((leaf) => toHex(leaf.hash) === toHex(hash(zeroValue)))
      ).toBeTruthy();
    });
  });

  describe('addLeaf', () => {
    it('must create new uncompleted tree with the given leaf added at nextIdx of the given tree and recompute hashes', () => {
      const mt = mkMerkleTree({
        leafs: [],
        depth: 4,
        zeroValue,
      }) as UncompletedMerkleTree;
      const valueToAdd = 'newValue';
      const expectedRootHashHex =
        'f88b701e4799145fc318cf4012c013acfb412202bf93d4a9e784dabd44ff03a1';
      const newMT = mt.addLeaf(valueToAdd);
      const addedLeaf = newMT.getLeafs()[0];

      expect(mt).not.toBe(newMT);
      expect(newMT.completed).toBeFalsy();
      expect(toHex(addedLeaf.hash)).toBe(toHex(hash(valueToAdd)));
      expect(toHex(newMT.root.hash)).toBe(expectedRootHashHex);
    });

    it('must create new completed tree with the given leaf that replaces a zero leaf of the given tree and recompute hashes', () => {
      const mt = mkMerkleTree({
        leafs: ['1', '2', '3', '4', '5', '6', '7'],
        zeroValue,
      }) as UncompletedMerkleTree;
      const expectedRootHashHex =
        '8f454ce466216a6b194e492727c49f68955bb174d2dc229b36cc3ed403099572';
      const newMT = mt.addLeaf('8');

      expect(mt === newMT).toBeFalsy();
      expect(newMT.completed).toBeTruthy();
      expect(toHex(newMT.root.hash)).toBe(expectedRootHashHex);
    });
  });

  it('must compute hashes correctly', () => {
    const mt1 = mkMerkleTree({
      leafs: ['one', 'two'],
      depth: 3,
      zeroValue,
    });

    const mt2 = mkMerkleTree({
      leafs: ['one'],
      depth: 3,
      zeroValue,
    }) as UncompletedMerkleTree;

    const mt2WithNewLeaf = mt2.addLeaf('two');

    expect(toHex(rootHash)).toBe(toHex(mt1.root.hash));
    expect(toHex(rootHash)).toBe(toHex(mt2WithNewLeaf.root.hash));
  });
});
