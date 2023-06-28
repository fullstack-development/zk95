use aiken/bytearray as bytearray
use aiken/hash.{Hash, Sha2_256, sha2_256}
use aiken/list as list
use aiken/math.{pow}

pub type MerkleHash =
  Hash<Sha2_256, ByteArray>

pub type MerkleTreeConfig {
  height: Int,
  zero_hash: MerkleHash,
}

pub type MerkleTree {
  root: ByteArray,
  leafs: List<MerkleHash>,
}

pub fn insert_leaf(
  self: MerkleTree,
  config: MerkleTreeConfig,
  leaf: MerkleHash,
) -> MerkleTree {
  if list.length(self.leafs) < pow(2, config.height) {
    let new_leafs = self.leafs |> list.concat([leaf])
    let root_hash = calc_root_hash(new_leafs, config.height, config.zero_hash)
    MerkleTree { root: bytearray.drop(root_hash, 1), leafs: new_leafs }
  } else {
    error @"Tree is full"
  }
}

fn calc_root_hash(
  self: List<MerkleHash>,
  height: Int,
  zero_hash: MerkleHash,
) -> MerkleHash {
  when hash_layers(self, height, zero_hash) is {
    [root_hash] -> root_hash
    _otherwise -> error @"Inconsistent merkle tree"
  }
}

fn hash_layers(
  self: List<MerkleHash>,
  current_height: Int,
  layer_zero_hash: MerkleHash,
) -> List<MerkleHash> {
  when current_height is {
    0 -> self
    h ->
      self
        |> pairwise(layer_zero_hash)
        |> list.map(hash_pair)
        |> hash_layers(h - 1, hash_pair((layer_zero_hash, layer_zero_hash)))
  }
}

fn hash_pair(self: (MerkleHash, MerkleHash)) -> MerkleHash {
  bytearray.concat(self.1st, self.2nd) |> sha2_256
}

fn pairwise(self: List<a>, filler: a) -> List<(a, a)> {
  when self is {
    [] ->
      []
    [a] ->
      [(a, filler)]
    [a, b, ..rest] ->
      [(a, b), ..pairwise(rest, filler)]
  }
}

// tests

// root
// #e6a48ea87e085ff9da119e62b0e3d1b3ecc5d2a5d5a7c1e3c4bdeed085741126

// leyer 2
// #14906ebe72476ddb9eb4ef558e9d06d6ec12650e328a0db06165f86b9775bbb7
// #32a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9

//leafs
// #e1587401f42aa18899004e6b313f62b1732dd9860ac4085f4790f62b24b7dec3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3

test insert_leaf_spec_1() {
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let config = MerkleTreeConfig { height: 2, zero_hash }
  let merkle_tree = MerkleTree { root: #"ff", leafs: [] }
  let leaf_to_add =
    #"e1587401f42aa18899004e6b313f62b1732dd9860ac4085f4790f62b24b7dec3"
  let new_merkle_tree = merkle_tree |> insert_leaf(config, leaf_to_add)
  new_merkle_tree.root == bytearray.drop(
    #"e6a48ea87e085ff9da119e62b0e3d1b3ecc5d2a5d5a7c1e3c4bdeed085741126",
    1,
  )
}

// tests

// root
// #70ddc1c3831bc1f083b64e3a3e51d56872f99bb1495c2a31651b09f087c3c0fa

// leyer 2
// #e5327ec300702c40c3f92fb21b90616de54d249f8082bc962b0a60483d7e03c1
// #32a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9

//leafs
// #e1587401f42aa18899004e6b313f62b1732dd9860ac4085f4790f62b24b7dec3
// #bdde83d5b26cd7677153640af3ce94739df8d51443024f2933abf843b8c1b009
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3

test insert_leaf_spec_2() {
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let config = MerkleTreeConfig { height: 2, zero_hash }
  let merkle_tree = MerkleTree { root: #"ff", leafs: [] }
  let leaf_to_add_1 =
    #"e1587401f42aa18899004e6b313f62b1732dd9860ac4085f4790f62b24b7dec3"
  let leaf_to_add_2 =
    #"bdde83d5b26cd7677153640af3ce94739df8d51443024f2933abf843b8c1b009"

  let new_merkle_tree =
    merkle_tree
      |> insert_leaf(config, leaf_to_add_1)
      |> insert_leaf(config, leaf_to_add_2)
  new_merkle_tree.root == bytearray.drop(
    #"70ddc1c3831bc1f083b64e3a3e51d56872f99bb1495c2a31651b09f087c3c0fa",
    1,
  )
}

test calc_root_hash_spec_1() {
  let height = 2
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)

  calc_root_hash([zero_hash], height, zero_hash) == #"c70db3a37303100f9c9654c50a0f1028c3adf55bd413e29177078617d19d4e63"
}

test calc_root_hash_spec_2() {
  let height = 2
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let leafs =
    [#"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6"]
  calc_root_hash(leafs, height, zero_hash) == #"24640b8b79e329ca31601c7e0dabcb1996f76cd14def32ba3e6864ce7f3c9ceb"
}

/// mem and cpu test
test calc_root_hash_spec_3() {
  let height = 40
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let leafs =
    [
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c5",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c4",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c3",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c2",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c1",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c0",
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c8",
    ]
  calc_root_hash(leafs, height, zero_hash) != #"ff"
}

// max mem 14000000 | max cpu 10000000000
//         16646174            6638887904
test calc_root_hash_spec_4() {
  let height = 10
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let leafs =
    list.repeat(
      #"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6",
      1024,
    )

  calc_root_hash(leafs, height, zero_hash) != #"ff"
}

test pairwise_spec_1() {
  pairwise([1, 2, 3], 999) == [(1, 2), (3, 999)]
}

test pairwise_spec_2() {
  pairwise([], 999) == []
}

test pairwise_spec_3() {
  pairwise([1], 999) == [(1, 999)]
}
