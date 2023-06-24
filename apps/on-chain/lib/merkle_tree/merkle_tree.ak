use aiken/bytearray.{concat, drop}
use aiken/hash.{Hash, Sha2_256, sha2_256}
use aiken/list.{length, map, push}
use aiken/math.{pow}

pub type MerkleHash =
  Hash<Sha2_256, ByteArray>

pub type MerkleTreeConfig {
  height: Int,
  zero_hash: MerkleHash,
}

pub type MerkleTree {
  root: Int,
  leafs: List<MerkleHash>,
}

pub fn insert_leaf(
  self: MerkleTree,
  config: MerkleTreeConfig,
  leaf: MerkleHash,
) -> MerkleTree {
  if length(self.leafs) < pow(2, config.height) {
    let new_leafs = self.leafs |> push(leaf)
    let root_hash = calc_root_hash(new_leafs, config.height, config.zero_hash)
    MerkleTree { root: root_hash_to_int(root_hash), leafs: new_leafs }
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
        |> map(hash_pair)
        |> hash_layers(h - 1, hash_pair((layer_zero_hash, layer_zero_hash)))
  }
}

fn hash_pair(self: (MerkleHash, MerkleHash)) -> MerkleHash {
  concat(self.1st, self.2nd) |> sha2_256
}

fn root_hash_to_int(self: MerkleHash) -> Int {
  self |> drop(1) |> to_int
}

fn to_int(self: ByteArray) -> Int {
  bytearray.foldl(self, 0, fn(byte, acc) { acc * 256 + byte })
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
// #24640b8b79e329ca31601c7e0dabcb1996f76cd14def32ba3e6864ce7f3c9ceb

// leyer 2
// #b16453bd26015165569436b466151395f86b103426c863e6f696f5c3c036c4aa
// #32a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9

//leafs
// #688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3
// #6e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3

test calc_root_hash_spec_1() {
  let height = 2
  let zero_value = "tornado.cash on cardano"
  let zero_hash = sha2_256(zero_value)
  let leafs =
    [#"688787d8ff144c502c7f5cffaafe2cc588d86079f9de88304c26b0cb99ce91c6"]
  calc_root_hash(leafs, height, zero_hash) == #"24640b8b79e329ca31601c7e0dabcb1996f76cd14def32ba3e6864ce7f3c9ceb"
}

/// mem and cpu test
test calc_root_hash_spec_2() {
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

test pairwise_spec_1() {
  pairwise([1, 2, 3], 999) == [(1, 2), (3, 999)]
}

test pairwise_spec_2() {
  pairwise([], 999) == []
}

test pairwise_spec_3() {
  pairwise([1], 999) == [(1, 999)]
}
