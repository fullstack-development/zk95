import { toHex, hashConcat, hash } from '@mixer/crypto';
import { makeMerkleTree } from './merkle-tree';

const zeroValue = 'tornado.cash on cardano';

// root
// #df9aa986054a388623b5c522f1d4b1fcf76e8c44de59456fdfc994a297ad2a2c

// layer 2
// #e5327ec300702c40c3f92fb21b90616de54d249f8082bc962b0a60483d7e03c1
// #ba3685ce959243f7088f2504f8eadd9a020fb216b7b6e7c56a83fc96678b2dbe

//leafs
// #e1587401f42aa18899004e6b313f62b1732dd9860ac4085f4790f62b24b7dec3
// #bdde83d5b26cd7677153640af3ce94739df8d51443024f2933abf843b8c1b009
// #6876d329b73b7769aa6286b8c25d62be3d15b7304f679951f36b3d985afae0ec
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3

const leaf1 = hash('commitment1');
const leaf2 = hash('commitment2');
const leaf3 = hash('commitment3');
const zeroLeaf = hash(zeroValue);

const layer2Hash1 = hashConcat(leaf1, leaf2);
const layer2Hash2 = hashConcat(leaf3, zeroLeaf);

const rootHash = hashConcat(layer2Hash1, layer2Hash2);

describe('Merkle Tree', () => {
  describe('make', () => {
    it('should calculate root hash correctly', () => {
      const mt1 = makeMerkleTree({
        leafs: [leaf1, leaf2, leaf3],
        height: 2,
        zeroValue,
      });
      expect(toHex(mt1.root)).toBe(toHex(rootHash));

      const mt2 = makeMerkleTree({
        leafs: [],
        height: 2,
        zeroValue,
      });
      expect(toHex(mt2.root)).toBe(
        'c70db3a37303100f9c9654c50a0f1028c3adf55bd413e29177078617d19d4e63'
      );

      const mt3 = makeMerkleTree({
        leafs: [leaf1],
        height: 2,
        zeroValue,
      });
      expect(toHex(mt3.root)).toBe(
        'e6a48ea87e085ff9da119e62b0e3d1b3ecc5d2a5d5a7c1e3c4bdeed085741126'
      );
    });
  });

  describe('insertLeaf', () => {
    //
  });

  describe('buildProof', () => {
    it('has to build proof correctly', () => {
      const mt = makeMerkleTree({
        leafs: [leaf1, leaf2, leaf3],
        height: 2,
        zeroValue: 'tornado.cash on cardano',
      });

      const proof1 = mt.buildProof(leaf1);
      const proof2 = mt.buildProof(leaf2);
      const proof3 = mt.buildProof(leaf3);

      expect(proof1.nodes.map(toHex)).toMatchObject([
        toHex(leaf2),
        toHex(layer2Hash2),
      ]);
      expect(proof1.path).toMatchObject([0, 0]);

      expect(proof2.nodes.map(toHex)).toMatchObject([
        toHex(leaf1),
        toHex(layer2Hash2),
      ]);
      expect(proof2.path).toMatchObject([1, 0]);

      expect(proof3.nodes.map(toHex)).toMatchObject([
        toHex(zeroLeaf),
        toHex(layer2Hash1),
      ]);
      expect(proof3.path).toMatchObject([0, 1]);
    });

    it('has to return empty proof if leaf is not in the tree', () => {
      const mt = makeMerkleTree({
        leafs: [leaf1, leaf2, leaf3],
        height: 2,
        zeroValue,
      });

      const proof = mt
        .buildProof(
          'f1587401f42aa18199004e6b313f62b1732ds9860ac4085f4790f62b24b7dec3'
        )
        .nodes.map(toHex);

      expect(proof).toMatchObject([]);
    });

    it('has to return empty proof if leaf is empty hash', () => {
      const mt = makeMerkleTree({
        leafs: [leaf1, leaf2, leaf3],
        height: 2,
        zeroValue: 'tornado.cash on cardano',
      });

      const proof = mt.buildProof(zeroLeaf).nodes.map(toHex);

      expect(proof).toMatchObject([]);
    });
  });
});
