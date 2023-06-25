import {
  combineLatest,
  first,
  map,
  shareReplay,
  switchMap,
  Observable,
} from 'rxjs';
import {
  Lucid,
  Address,
  Data,
  TxHash,
  toHex,
  addAssets,
  Constr,
  fromText,
} from 'lucid-cardano';

import {
  ONCHAIN_CONFIG_KEY,
  OnchainConfig,
  fromMixerDatum,
  fromMixerRedeemer,
  toMixerDatum,
} from '@mixer/onchain';
import { chainIndexProvider } from '@mixer/chain-index-provider';
import { injectable, token } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';
import { mkWalletModel } from '@mixer/wallet';
import { Script } from '@mixer/chain-index-provider';
import { assert } from '@mixer/utils';

import { MixerDatum, MixerRedeemer } from './scheme';
import { deserializeMerkleTree } from './utils';
import { mkProviderAdapter } from './providerAdapter';
import { reverseBits } from '@mixer/hash';
import { MerkleTree } from '@mixer/merkletree';

export type Offchain = {
  deposit$: (
    poolSize: number,
    commitmentHash: Uint8Array
  ) => Observable<TxHash>;
  withdraw$: (note: string, address: string) => Observable<TxHash>;
};

export const mkOffchain = injectable(
  token(ONCHAIN_CONFIG_KEY)<OnchainConfig>(),
  mkWalletModel,
  chainIndexProvider,
  combineEff((onchainConfig, walletModel, provider): Offchain => {
    const lucidProvider = mkProviderAdapter(provider);

    const lucid$ = combineLatest([
      Lucid.new(lucidProvider, 'Preprod'),
      walletModel.wallet$,
    ]).pipe(
      map(([lucid, wallet]) =>
        wallet ? lucid.selectWallet(wallet.api) : lucid
      ),
      shareReplay(1)
    );

    const deposit$ = (poolSize: number, commitmentHash: Uint8Array) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) => deposit2(lucid, poolSize, commitmentHash))
      );

    const withdraw$ = (note: string, address: string) =>
      lucid$.pipe(
        first(),
        switchMap((lucid) => withdraw(lucid, note, address))
      );

    // async function deposit(
    //   lucid: Lucid,
    //   poolSize: number,
    //   commitmentHash: Uint8Array
    // ) {
    //   const config = onchainConfig[poolSize];

    //   assert(`Pool with ${poolSize} nominal not found`, config);

    //   const depositScriptAddress: Address = lucid.utils.validatorToAddress(
    //     config.depositScript
    //   );

    //   const depositUTxOs = await lucid.utxosAt(depositScriptAddress);
    //   console.log(depositUTxOs);
    //   const utxoWithScriptRef = depositUTxOs.find(
    //     ({ scriptRef }) =>
    //       scriptRef && toAddress(lucid, scriptRef) === depositScriptAddress
    //   );

    //   assert(
    //     `Cannot find a utxo with the deposit referece script`,
    //     utxoWithScriptRef
    //   );

    //   const vaultUTxO = depositUTxOs.find(
    //     ({ assets }) => assets[config.vaultTokenUnit] !== undefined
    //   );

    //   assert(`Cannot find a utxo with the vault`, vaultUTxO);
    //   assert(`Cannot find a vault datum`, vaultUTxO.datum);

    //   const merkleTreeUTxO = depositUTxOs.find(
    //     ({ assets }) => assets[config.depositTreeTokenUnit] !== undefined
    //   );

    //   assert(`Cannot find a utxo with the merkle tree`, merkleTreeUTxO);
    //   assert(`Merkle tree datum is missing`, merkleTreeUTxO.datum);

    //   const inputDatum = Data.from(
    //     merkleTreeUTxO.datum,
    //     MixerDatum as never as MixerDatum
    //   );

    //   console.log({
    //     datum: merkleTreeUTxO.datum,
    //     commitment: toHex(commitmentHash),
    //   });

    //   assert('Wrong merkle tree datum', inputDatum !== 'Vault');

    //   const merkleTree = deserializeMerkleTree(
    //     config.zeroValue,
    //     inputDatum.DepositTree.DepositDatum.merkleTreeState.tree
    //   );

    //   assert('Pool is full', !merkleTree.completed);

    //   const nextMerkleTree = merkleTree.addLeaf(commitmentHash, false);

    //   console.log({
    //     merkleTree,
    //     nextMerkleTree,
    //   });

    //   const serializedRoot = toHex(
    //     reverseBits(nextMerkleTree.root.hash, 0, 31)
    //   );

    //   const outputDatum: MixerDatum = {
    //     DepositTree: {
    //       DepositDatum: {
    //         merkleTreeRoot: {
    //           Just: [BigInt(`0x${serializedRoot}`)],
    //         },
    //         merkleTreeState: {
    //           nextLeaf: BigInt(
    //             nextMerkleTree.completed
    //               ? nextMerkleTree.leafsCount
    //               : nextMerkleTree.nextIdx
    //           ),
    //           tree: serializeMerkleTree(nextMerkleTree),
    //         },
    //       },
    //     },
    //   };

    //   const depositRedeemer: MixerRedeemer = {
    //     Deposit: [toHex(commitmentHash)],
    //   };

    //   const vaultRedeemer: MixerRedeemer = 'Topup';

    //   const tx = await lucid
    //     .newTx()
    //     .readFrom([utxoWithScriptRef])
    //     .collectFrom(
    //       [merkleTreeUTxO],
    //       Data.to<MixerRedeemer>(depositRedeemer, MixerRedeemer as never)
    //     )
    //     .payToContract(
    //       depositScriptAddress,
    //       { inline: Data.to<MixerDatum>(outputDatum, MixerDatum as never) },
    //       merkleTreeUTxO.assets
    //     )
    //     .collectFrom(
    //       [vaultUTxO],
    //       Data.to<MixerRedeemer>(vaultRedeemer, MixerRedeemer as never)
    //     )
    //     .payToContract(
    //       depositScriptAddress,
    //       { inline: vaultUTxO.datum },
    //       addAssets(vaultUTxO.assets, {
    //         lovelace: BigInt(poolSize) * BigInt(1000000),
    //       })
    //     )
    //     .complete();

    //   const signedTx = await tx.sign().complete();
    //   const txHash = await signedTx.submit();
    //   return txHash;
    // }

    async function deposit2(
      lucid: Lucid,
      poolSize: number,
      commitmentHash: Uint8Array
    ) {
      const config = {
        treeTokenUnit:
          '4346dc59b6c8cca42c6d168ae7b7422de0911fc073ae586b39996aee54726565',
        vaultTokenUnit:
          '4346dc59b6c8cca42c6d168ae7b7422de0911fc073ae586b39996aee5661756c74',
        depositScript: {
          script:
            '590d93590d90010000332323232323232323232323223232322223232533300e323232323232323232323253330193370e9000180c00109919299980d99b8748000c0680144c8c8ccccc8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c88888c8c8c8c8c8c8c8c8c8c8c8c8c94ccc1214ccc1214ccc12000c5288a99824a4921636f6d6d69746d656e745f69735f6e6f745f696e5f74726565203f2046616c73650014a02a666090002294454cc12524011e747265655f757064617465645f636f72726563746c79203f2046616c73650014a0294054ccc1200085288a99824a491876616c75655f69735f636f7272656374203f2046616c73650014a02940cdd79991299982499b88301c37586608a608e02290011980d240086eb4cc114c11c0092000132323374a9000198281ba9333718900119b81371a0029001000998281ba70024bd7019911929998288008a99827248118496e636f6e73697374656e74206d65726b6c652074726565001613253330520011375c60a80042a6609e920118496e636f6e73697374656e74206d65726b6c65207472656500163054001333016003002001375a6608c609000690001bae33046304800348008c8cc13cdd48010009bac3304530470114800854cc1292410c547265652069732066756c6c001633043304501048020038014cdd79ba600233042304400648008ccc114cc068dd6198209821806a4004018941289919199981080100091119299982529998270008a5114a02980103d87a800013374a9000198279ba60014bd70199981000100091119299982699b87001480005300103d87a800013374a9000198291ba80014bd7019b8000200102a027375666082608666082608600e90012400464a66608a66e1c005200014bd6f7b6300991999812a5eb7bdb1812210000102733330274bd6f7b63024500001026337046eb4cc100c10803520064820225e8c0ec004c120004c0fcc94ccc108cdc3a4008608200220022a6608692012a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e00163303d303f00148010c118004c0f4c94ccc100cdc3a4000607e00220022a6608292012a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e00163332223302d00123370e6660606eaccc0fcc104005200200400348008dd71981d981e804240006eb8cc0ecc0f40212002375866076607a66076607a00a9000240086088002607664a66607c66e1d2000303d0011001153303f49012a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e0016323302900123375e66076607a00290000019bac33039303b33039303b0034800120003042001303932533303c3370e9001181d80088008a9981ea4812a4578706563746564206f6e20696e636f727265637420636f6e7374727563746f722076617269616e742e001633037303900148008c00400488894ccc0e4cdc3a4000004200626464666600c00c00266e0401120023007337606ea400cdd480199803800803198040018009191b920013322337140040026eb8c0dc004dd7181c0009800800911299981c8010a5eb804c8c8cc0f0dd49801801199802802800801981e801981d8011800800911299981b8010a5eb7bdb1804c94ccc0e00044c8cc0e8cdd81ba9001375200697adef6c60375c607400626464646607866ec0dd48019ba9002333007007001005303d003375c60760046eb8c0e800cc0e8008c0040048894ccc0c4cdc4000a4000290000a99981899b870014800052002153330313370e66e180052004480004ccc00c00ccdc100100119b83001480104cdc100119980180199b820020023370666e04005200248010c004004894ccc0c80045200013233700900119801801800981a800980080091129998188010a5013232533302f3371e00400629444ccc01401400400cc0d400cdd718198011800800911112999818802080189919191919999804804801999998050038008010030028030029bae3032003375a6064004606a00a60660086002002444444a66606000a26606266ec0dd48021ba80034bd6f7b630099191919299981819baf330050080014c0103d8798000133035337606ea4020dd40038048a99981819b8f0080011323253330323370e9000000899191981c99bb037520186ea000401cdd6981c80098180010802981800099980300400380109981a99bb037520026ea0008cccccc02802800c02001c018014dd718188019bad303100230340063032005300100122222533302d0041003132323232333330090090033333300a007001002006005006005375c605c0066eacc0b8008c0c4014c0bc010c0040048888894ccc0b00144cc0b4cdd81ba9004374c00697adef6c60132323232533302c3375e6600a01000298103d8798000133031337606ea4020dd30038048a99981619b8f00800113232533302e3370e9000000899191981a99bb037520186e9800401cdd5981a80098160010802981600099980300400380109981899bb037520026e98008cccccc02802800c02001c018014dd718168019bab302d0023030006302e005300100122222533302900413302a337606ea400cdd300125eb7bdb1804c8c8c8c94ccc0a4cdd799802803800a60103d879800013302e337606ea401cdd30030040a99981499b8f00700113302e337606ea401cdd300300189981719bb037520026e98008ccccc02402400c01c018014dd718150019bab302a002302d005302b00422533302133720004002298103d8798000153330213371e0040022980103d87a800014c103d87b80003001001222225333026004133027337606ea400cdd400125eb7bdb1804c8c8c8c94ccc098cdd799802803800a60103d879800013302b337606ea401cdd40030040a99981319b8f00700113302b337606ea401cdd400300189981599bb037520026ea0008ccccc02402400c01c018014dd718138019bad3027002302a0053028004018003001012375c6044002603200a0066040002602e004002264a66603266e1d20023018002153330193370e9000180c00189919299980d99299980e19b87480000044c928980d0010a50301a00114a22a6603892011c69735f736f6d6528747265655f6f757470757429203f2046616c73650014a066644466010002466e1cccc02cdd59980d180e1980d180e000a40049001002001a40046eb8cc058c0600552000375c6602c603002a90011bac33016301833016301800f4800120003017003001001153301949010f6e6f7420696d706c656d656e7465640016301900930190083001001222533301b00214c103d87a8000132325333019300300213374a90001980f00125eb804ccc01401400400cc07c00cc074008888c8c8c94ccc064cdc3a4004002290000991bad3020001301700230170013253330183370e90010008a60103d87a800013232330080010053756603e002602c004602c0026600c0060046002002444a666030004298103d87a800013232323253330183371e00a002266e9520003301d375000497ae01333007007003005375c60320066eb4c064008c07000cc068008c0040048894ccc058008530103d87a800013232323253330163371e00a002266e9520003301b374c00497ae01333007007003005375c602e0066eacc05c008c06800cc060008cdd80008010a4c2c6400a64a66601c66e1d20000011323253330143017002132498c02000454cc045241334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e20657870656374656400163015001300c0051533300e3370e90010008a99980918060028a4c2a6601e92011d4578706563746564206e6f206669656c647320666f7220436f6e7374720016153300f4912b436f6e73747220696e64657820646964206e6f74206d6174636820616e7920747970652076617269616e740016300c0043200332533300d3370e9000000899192999809980b0010a4c2a66020921334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e2065787065637465640016375c602800260160062a66601a66e1d200200115333011300b003149854cc03924011d4578706563746564206e6f206669656c647320666f7220436f6e7374720016153300e4912b436f6e73747220696e64657820646964206e6f74206d6174636820616e7920747970652076617269616e740016300b002232533300a3370e90000008991919192999809180a80109924c6600e002464931bae001153300f491334c6973742f5475706c652f436f6e73747220636f6e7461696e73206d6f7265206974656d73207468616e20657870656374656400163758602600260260046eb8c044004c02000854cc02d2412b436f6e73747220696e64657820646964206e6f74206d6174636820616e7920747970652076617269616e74001630080013001001222533300d00214984c8ccc010010c04400c008c004c03c008cc0040052000222233330073370e00200601a4666600a00a66e000112002300f001002002230063754002460086ea80055cd2b9c5573aaae7955cfaba05742ae89300156d8799f581c4346dc59b6c8cca42c6d168ae7b7422de0911fc073ae586b39996aee4454726565455661756c741864d8799f0858206e045b8f5eaa4bdc8f8a44797255d03f4e2aac366e32859c5d07cd8de46c2ea3ffff0001',
          type: 'PlutusV2',
        } as Script,
        zeroValue: 'tornado.cash on cardano',
      };

      const depositScriptAddress: Address = lucid.utils.validatorToAddress(
        config.depositScript
      );

      const depositUTxOs = await lucid.utxosAt(depositScriptAddress);

      const utxoWithScriptRef = depositUTxOs.find(
        ({ scriptRef }) =>
          scriptRef && toAddress(lucid, scriptRef) === depositScriptAddress
      );

      assert(
        `Cannot find a utxo with the deposit reference script`,
        utxoWithScriptRef
      );

      const vaultUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.vaultTokenUnit] !== undefined
      );

      assert(`Cannot find a utxo with the vault`, vaultUTxO);
      assert(`Cannot find a vault datum`, vaultUTxO.datum);

      const merkleTreeUTxO = depositUTxOs.find(
        ({ assets }) => assets[config.treeTokenUnit] !== undefined
      );

      assert(`Cannot find a utxo with the merkle tree`, merkleTreeUTxO);
      assert(`Merkle tree datum is missing`, merkleTreeUTxO.datum);

      const Redeemer = Data.Enum([
        Data.Object({
          Deposit: Data.Tuple([Data.Bytes()]),
        }),
        Data.Literal('Withdraw'),
      ]);

      type Redeemer = Data.Static<typeof Redeemer>;

      const redeemer = Data.to<Redeemer>(
        {
          Deposit: [toHex(commitmentHash)],
        },
        Redeemer as never
      );

      const Datum = Data.Enum([
        Data.Object({
          Tree: Data.Object({
            root: Data.Bytes(),
            leafs: Data.Array(Data.Bytes()),
          }),
        }),
        Data.Literal('Vault'),
      ]);

      type Datum = Data.Static<typeof Datum>;

      const inputDatum = Data.from<Datum>(merkleTreeUTxO.datum, Datum as never);

      assert(`Wrong datum in the merkle tree utxo`, inputDatum !== 'Vault');

      const merkleTree = MerkleTree.make({
        height: 7,
        leafs: inputDatum.Tree.leafs,
      });

      assert('Pool is full', !merkleTree.completed);

      const nextMerkleTree = merkleTree.insert(commitmentHash);

      const outputDatum = Data.to<Datum>(
        {
          Tree: {
            root: toHex(nextMerkleTree.root.slice(1)),
            leafs: nextMerkleTree.leafs.map(toHex),
          },
        },
        Datum as never
      );

      const tx = await lucid
        .newTx()
        .readFrom([utxoWithScriptRef])
        .collectFrom([merkleTreeUTxO], redeemer)
        .payToContract(
          depositScriptAddress,
          { inline: outputDatum },
          merkleTreeUTxO.assets
        )
        .collectFrom([vaultUTxO], redeemer)
        .payToContract(
          depositScriptAddress,
          { inline: vaultUTxO.datum },
          addAssets(vaultUTxO.assets, {
            lovelace: BigInt(poolSize) * BigInt(1000000),
          })
        )
        .complete();

      const signedTx = await tx.sign().complete();
      // const txHash = await signedTx.submit();
      return '';
    }

    async function withdraw(lucid: Lucid, note: string, address: string) {
      const datumIn =
        'd8799fd8799fd8799f00d87a9f5820c70db3a37303100f9c9654c50a0f1028c3adf55bd413e29177078617d19d4e63d87a9f582032a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9d87980d87980ffd87a9f582032a7b13eff6836a40fd4f2b9e1da47de280f371b0ff3ef361828e0d88814a7f9d87980d87980ffffffd87a80ffff';
      const commitmentHashHex =
        'af3a62ef64a383b4f07041bb2b086b1789815ffbbf7e4bac9f59adb641f921ce';
      const userAddress = await lucid.wallet.address();
      const config = onchainConfig[100];

      const inputDatum = Data.from(datumIn, MixerDatum as never as MixerDatum);

      assert('Wrong merkle tree datum', inputDatum !== 'Vault');

      return '';
    }

    function toAddress(lucid: Lucid, script: Script) {
      return lucid.utils.validatorToAddress(script);
    }

    return {
      deposit$,
      withdraw$,
    };
  })
);
