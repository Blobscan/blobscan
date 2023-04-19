import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const blocks = await prisma.block.createMany({
    data: [
      {
        hash: "0xc88442e58b48dbd49476a2d79e94b8ec69ea5c90f9ab1c915ecc6fa25e62a921",
        number: 1117,
        timestamp: 1674653796,
        slot: 1223,
        id: "0xc88442e58b48dbd49476a2d79e94b8ec69ea5c90f9ab1c915ecc6fa25e62a921",
      },
      {
        id: "0xffca5df7aa648e447956d1dc08a233f85cae92537364f9ee5c499427447b5aab",
        hash: "0xffca5df7aa648e447956d1dc08a233f85cae92537364f9ee5c499427447b5aab",
        number: 1138,
        timestamp: 1674654084,
        slot: 1247,
      },
      {
        id: "0xb213b78bad213f37ab41fcd30b0d6eca464a23269dec15a45b5a57022a3eb808",
        hash: "0xb213b78bad213f37ab41fcd30b0d6eca464a23269dec15a45b5a57022a3eb808",
        number: 1148,
        timestamp: 1674654204,
        slot: 1257,
      },
      {
        id: "0x4079c7661b2eddcb5e3dfe31c59077a0ed793e114f575ab2a21cab1bcfd8d736",
        hash: "0x4079c7661b2eddcb5e3dfe31c59077a0ed793e114f575ab2a21cab1bcfd8d736",
        number: 1163,
        timestamp: 1674654420,
        slot: 1275,
      },
      {
        id: "0x281ff6c4fdc926a670224181fe709a2ef88b54e09a515e50599f948cdb63eb0b",
        hash: "0x281ff6c4fdc926a670224181fe709a2ef88b54e09a515e50599f948cdb63eb0b",
        number: 1165,
        timestamp: 1674654444,
        slot: 1277,
      },
      {
        id: "0x3be9064000fff0ef71f8b6f7c65466ce598e783b13bb9d423a383907a5ab598c",
        hash: "0x3be9064000fff0ef71f8b6f7c65466ce598e783b13bb9d423a383907a5ab598c",
        number: 1187,
        timestamp: 1674654792,
        slot: 1306,
      },
    ],
  });

  const txs = await prisma.transaction.createMany({
    data: [
      {
        id: "0x31b315056d41d2e05b3a9d6b8beb4dadcffd286a62ca37dd7de0c89debe2633e",
        hash: "0x31b315056d41d2e05b3a9d6b8beb4dadcffd286a62ca37dd7de0c89debe2633e",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1117,
      },
      {
        id: "0xc58cf663fbcc89be9da5ad884f8f9d87221b95e75c33d80c21fa16e426fb2f3c",
        hash: "0xc58cf663fbcc89be9da5ad884f8f9d87221b95e75c33d80c21fa16e426fb2f3c",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1138,
      },
      {
        id: "0xa22bb3ee637f80f3e4c60ad55130d808fc43efa2dfe0fb6cf210c593fb39b520",
        hash: "0xa22bb3ee637f80f3e4c60ad55130d808fc43efa2dfe0fb6cf210c593fb39b520",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1148,
      },

      {
        id: "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        hash: "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1163,
      },

      {
        id: "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        hash: "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1165,
      },

      {
        id: "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        hash: "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        from: "0x123463a4b065722e99115d6c222f267d9cabb524",
        to: "0x0000000000000000000000000000000000000000",
        blockNumber: 1187,
      },
    ],
  });

  const blobs = await prisma.blob.createMany({
    data: [
      {
        versionedHash:
          "0x010c30956be2a7db889757f855d3d42d4a3660a90f0c86aaef23586ac0f050b5",
        commitment:
          "0xb5c9fab570e87b2dab94a5f8e2f11d55433a0a4c35ec553307a5ebb75e383a38b15eb21f06d95be5bf71f42cf731f223",
        data: "0x89504e470d0a1a0a0000000d49484452000002800000019508060000006e3e00409600000c3c694343504943432050726f66696c6a9a443aa23c510",
        txHash:
          "0x31b315056d41d2e05b3a9d6b8beb4dadcffd286a62ca37dd7de0c89debe2633e",
        index: 0,
      },
      {
        versionedHash:
          "0x01c97b77e1fc5f69618cfbf94e0d7486ebdfab1ce1173e59c908ac5b61a12fc2",
        txHash:
          "0x31b315056d41d2e05b3a9d6b8beb4dadcffd286a62ca37dd7de0c89debe2633e",
        commitment:
          "0xb47dfab191db137f8793eec54ca440ce8c9919c1f053cbe67ea1c2b6610155078e64f5b86aafa099e09313627efa60bb",
        data: "0xf4b11554fdd249165cea03cf6e9c4f402ca1326adfa43376dbfb81f44ccc2b00afac90d8ce14b9608c0128687bcd84cf8e21bca833e7bb5f3b8bab715914c00012877abb2d0842f80f4ae9b7064ca8d02aeee4c398f35ab24040570ecedfaa001c1fc536c58cb83db8393eec4c602fac3d5fc7386ee53f17263ae77e37eee50014aedc3cf678cf81ca70ec98c7313847aa9e963b37b00feaaf79fcf55ffff500edfffc0fbf70fbc9fad2e78fea6b60fca5cffd573e78aa5773902781be91f900f700798ae076304ad89bc4da25c64656919970cb5d4bd1035b71366ef55c630000ec50ba6deeb29ced804b97e5b37c276eca0b6081cbb73ed8a601af75aaeb00f969ccefc8ed7bbf013991bf6533e3d5ec1aa34b8a27fa13bc7a90bcb5e66300a9fadc1ea677158f2336583ad7f739565af3ea1b6b87c87340a63cf2781bb100c7e79e094db4557b909bf9340281f5ba02b454778d3305fd9a65b712054de40005162c5aeafef5b0eddea4f2aec39da1ec279d07980bb8099d9a4f5a83ad370073ed3799189f554ac06906138eb461887caed951b76e9d94b4a377441fd15300c241274ebe8f72225df9ce43f92e7cf48991367574a9ad83ef9e13dbd60b53006efb4fa439649eb8a9cb85f705be26b2b1ab165bd98b88e8d4e2ea5d1a3bff006081124f17f202a76bcaa16d609e2af1790af394ed7ca3ca12cf7ac2d732bd00a1785386449ee7015d7c18e302eead8a983bee76f4eabeb66d145261b4de2d001e6c763fa86663e55f4ae4f9a30e759f3426b9908760f677c4999c81cef1b500cebd83e20a1fbf55c33fe32d83d5e6b772a4f2d84996263cf00eddd4b7ecac0047f093082cfd893c730b9c9bacfa53d5923192fcb1037179ab9a1c4c6532e7007d9509b47b8dcf208fd05b4f14ff6c1de9fb275c20d0bea9c77f1fd75ff9f800a55ff9f5db1ffed95fdebefae52feaad5ffdc58fdaf87d585ffdc25f05f95c006d12f5d4efc3ba56b021e46de11a2f7d30a40cd56c998d205793b1f92b1cbf001f880f1718be18da9b29a5a0b15576f0b54ad7a862e15f5e6076e9fee8e2530010418d172e6d39b49e3c9a63d7d0930f751daa70a4add2c2ca77a90bbd40ad00a45aba100cdba710f5a4498bb778eb3a7edc34752cc682794d4d3cc917813f00838dde4514a92e4742e374697944f3504faf77617cac71d563d273abf1d1da00df1e6f231d634dcf58885f2fbaa6277f08b59ad1e9fe9b1a5fad3c65e3f3b100f72fa1027259b252e9cd3d7869089d866a14146ace5335dcb41a6216362d3c00b808053e71d829b682f4668d4f925ea504d699ac982544c6ea92cb92f968ad00f3a9008e66e4f49dfa263a60a373ed6ce3f314cfe3be6cc6f89feb8d78b9e400cc1a1fc2b88ff610633d0ea6877adb46fbec3bdbc879c579b85a351d02ea1a00ec7c4df31dcf30eee54cfc6380b4b2aab43e17e605331482116f8a4fe575c400712e1cc9664e132b99ab8f5e77969c0a0703cc673e72534c25b963cf1bcfd6001ee8dc189d3be70e40e757d519d3cd65c7e8c11efc3710835f80469990a1960018aef437f5c271d24330f25ff259bf9c8e426258bbe76ef6291ec2562c8d47005f7074832556e2cd5cd07dca72d7e7e23b86f0159530c1a626a79902f9e37b00f6c7f7ae942338f9d4273f5ebdfaf0f6677ff117b77ff38d5fb8fdab9ff87a007dd8a39efef1f77dd9c4d51d82b5c65fe8c8a776696b03a81accb0b1bf43",
        index: 1,
      },

      {
        versionedHash:
          "0x01f82e7b77755f48fd8ed247d69ae346ff52264324973b6e471d24c2b4cfb254",
        txHash:
          "0xc58cf663fbcc89be9da5ad884f8f9d87221b95e75c33d80c21fa16e426fb2f3c",
        commitment:
          "0xb0bab04895721d47d9b23fb9816069b15f874a043cb060835efd4b40d30c0cd139183f86f298c0786c22b372ecf558bc",
        data: "0x9d78518e00195dbc0c207618034fe4142b51a0ea498a89a9da9fc05a8c57f500255912d8e4683e11046c1e59e6a5056b24fa7aa4f5f37ae9d538af7ad7f45f0087",
        index: 0,
      },

      {
        versionedHash:
          "0x01da80f5e1bd215a9908ca63b32c71603fc4cedd2eda2b1ca091d498630d4d90",
        txHash:
          "0xa22bb3ee637f80f3e4c60ad55130d808fc43efa2dfe0fb6cf210c593fb39b520",
        commitment:
          "0xb3d3c74a31435a63985b6227a7e4d1275889046e018c7957426142826b3ee7deff3627886927296290f4c695a668dfcb",
        data: "0x0c9e0074012c27ab9b893ef040cb989d6a379108a1fa5c1fd208c85f05df9f00738970854dc568028062fb8e2c1f2cc94e4723680757c45d73260adf13b16f00276a888d",
        index: 0,
      },
      {
        versionedHash:
          "0x019fe1411d08cdf8eec7580ccb4bc2dbaa5166953bd93b817e10a8bd9e4e1efc",
        txHash:
          "0xa22bb3ee637f80f3e4c60ad55130d808fc43efa2dfe0fb6cf210c593fb39b520",
        commitment:
          "0x889b31ba4b16f0fe2a90d7d26f4624a0b44dabba2a6709a4d317eea0a1a8797a882413c8d18ec3549f1b65627dd9a386",
        data: "0x44d4260015705cba5dbd0e825c64a25afbf632432417dd7d51a331f6dfedc900314ed912712b775c9e1f234503b244f85f82c13b60b72bb8313da5731300ba00e0dd27d97750f29ff225716ff40b85e4ee6d41e9a4e1cd6740cebf41277352000ec3149069a4e0183259d753eab2c4a83d3f402",
        index: 1,
      },
      {
        versionedHash:
          "0x019579cabc360fda09c8d63734b77665d2dab87e1adb4bd4363ce0957382bf32",
        txHash:
          "0xa22bb3ee637f80f3e4c60ad55130d808fc43efa2dfe0fb6cf210c593fb39b520",
        commitment:
          "0xa7aead30ceeb88ceb6e8fe5963d0a05a7817bd4341b56638adc386ede40ffd8577bbb28408bb49fe42b9e5a287e70192",
        data: "0xb99e5d01835d607e182c856313dc9fc476bac4433ed5f1bc8ab2d4e88c22de00eefff02ad2747c9b95c2f9619a30b24b0bc99b4719dfa5e643b4c543d5ab45003a78a76723f",
        index: 2,
      },

      {
        versionedHash:
          "0x0174d6ba5081ba878c542ab5a1c591448b5bbef3fd914fc218a43fcce75ccb60",
        txHash:
          "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        commitment:
          "0xb2c599be709d939f482278aa604a1e50562366677b117d8feac5b16e7f85c6afc374023bcd583ba1d7bece97dda5bc6f",
        data: "0xf6ce95ea7043da427dba7a73f7185710fb88fe8260da9d2515ac639904788a003a10bc410e25f505ed5b6d2c18d02e2f13f7364e7a43167a51407f06e56c2200",
        index: 0,
      },
      {
        versionedHash:
          "0x011cf3291b7cd00ae198d454f1a6f84430ab555bd986a56c466fcc8f7597266f",
        txHash:
          "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        commitment:
          "0x87ec058f6934f10c3dc48a3bf176e6c2a45b29e9343b44083e05078d93b769a277df4472ce295b9509b265a81d95b9f7",
        data: "0xea34a777cf9be599a6fc7b56febaa59d4501c5ed027cf963b6bad98b3aa2c5006e809feecaea6f494128c3d5f380673e2525857f93ce18bd5649a2b3f951b600",
        index: 1,
      },
      {
        versionedHash:
          "0x01624dad992a839f0e28aa6dbbd79217e251eece5a7c03b683775521a987ca4c",
        txHash:
          "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        commitment:
          "0x9651840ff099e04a235467d4c65aa7082ced382f6997068d43c026460ed7fb2aae23f77250e5b056bf665653729d3b83",
        data: "0xd880853dff13df76397934198600e6b80c7194303840980cbeeaa6dea89cb400d30bac00446859635aa9c4efcf86f900dcdb7f4f90af8188b30c0ebfc4",
        index: 2,
      },
      {
        versionedHash:
          "0x0150cd3d03ee820455b8bdd80dcaed8fc6fdf81837aa1ae20272c677d7d2a826",
        txHash:
          "0xbeb7fb8439c3cecf1a0eb89952218f11184cde141897ded82cca6a72140f443b",
        commitment:
          "0xaae5c8105238639afb7ba7d341cd17cc61a6cc3ff3485e4df4a5c10646a60d2b81269bef820e64a3dbb249edda9c805f",
        data: "0x66f35e7081bad5eab4752cc49fc0f3962d7df73b370a7b75e92050b386622c00472b8e0118683821226163c2905f1cd20d8f5cea7b6b9f767f3c7a349d0e3600c24808e2b4c07124e2b90e03a37",
        index: 3,
      },

      {
        versionedHash:
          "0x016d16fb0295467465d5185e99c8e34c5f2a2f143f9ba52b17b7015b6f064291",
        txHash:
          "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        commitment:
          "0xaeca5202cc59136a04438d78374247e514384f8231c22b6afac2a1cbd6c6c94e6fa2bfbb86ca06eab788d8e4793151ac",
        data: "0x5e4077694484e88ebbbf463207755bd2e8307b3acefc2a49aa44677f0a446f00cf1217515c41bb30a0b4b0b62f2029814317aa5bb0562da3bc1ae71041b77f00dab7a4a9977b229a25f309ed25",
        index: 0,
      },
      {
        versionedHash:
          "0x01d3d38bf080ecd844af3a615f17b24e2e3895dac274006f5965b5782136825d",
        txHash:
          "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        commitment:
          "0xa79f9803c7d27a3298edceb1b15383cac167a199e5eee32b4db017945825d075dbdeb33644c0b35c00efe13eee20de3e",
        data: "0xe70f6b7f502c12831fd7ab8f978adcf32303153f0539a9b703972372e6ab930034d88b839600866fd1a3de483c1c1c44d7f4867fa29a6edac01602cf22427800a55b1c3da3add72865bd",
        index: 1,
      },
      {
        versionedHash:
          "0x012ade7c4fa04e6156f5453e4cbab505f572741c7e1dc3ab10d42bdabf3ea3fe",
        txHash:
          "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        commitment:
          "0x9237a2a66be0f351b48274c59bbfcbcd6e921860c5889eeefb46e19d8e7a311a0c57433cbfd07d2d8bb26c1b80de46c3",
        data: "0x5842c75bbf82238e8d747c23595cfe7b71abf41a29302331d597ea4461d28d0078649f3c119e10c9b4a408790d9eb8e53e6ee840767e2f4d6916b6f33fe38b00cd892b1e6c7",
        index: 2,
      },
      {
        versionedHash:
          "0x01d8583c9aa5a8bb904f6d3ac365945bb074275338ed7b087bbc1048e32bb2a3",
        txHash:
          "0xed28783d52f92e6daebc8c6629d3fc4d2b65cf2fe9b0ea3be1ec47d14ae3eac2",
        commitment:
          "0xb9cb84113ea0a7ae96338a8ac7e307ce24c959c1c7ebec758abe727999e784f8b2f10eb60d2f2bef26de6d5895cb6622",
        data: "0x0dd47f7841c7310d5b2c7067fc0622fe66728c0fb25f14883482395c3de99f00b390fcc157e43bdb5c02fa69fe568daaf3bd169f0aff22fd3c35bd0a5ab3ca00938d",
        index: 3,
      },

      {
        versionedHash:
          "0x01656e572268a99f4c3d7c895350dae93154a9addcb2c0c04da67d11d5bb3101",
        txHash:
          "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        commitment:
          "0xa008411859daaeb4f907d98cd7c7428532bb0c029d3f1ee7bba62e36e21a71505067c0b3b2e62902f4602361ad38d974",
        data: "0x23eb25e61c443b28601ceced4af0c4d135586c67a476c8b5604d1e378911d400ffad545b1f40bb691aa70cebb0d79ae00d79dcc0fc51e93435abdda90861a300434203c04c7025ab6",
        index: 0,
      },
      {
        versionedHash:
          "0x0129577b953e4d76bcaf950416a0a433bb31983a5c16b4f2081aae3eabb2bca5",
        txHash:
          "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        commitment:
          "0xb04ed14578e3287c9bfd16b27e8d127099229c28e5d0a11a8df7225c4a74aee2d8163a67c7c3c9fe464b70dccdc358f5",
        data: "0x76a9af5261cbcfb81b338e64d364dbbf4079ea99f07f67a0db7d548fd301aa0032fec6686d3a0f252d7eecfa0f9731b7f42cd1a0193928edf632f53a796ebc0050c1be188d25f6314bb6727ad7e39ce44bab9251d0ab9",
        index: 1,
      },
      {
        versionedHash:
          "0x01f489000908908189a0c90a85d25915b941f78396a02e71822c0512407a9407",
        txHash:
          "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        commitment:
          "0xa5fe7a63d04b41cd1c58e87cd51044177c20eedfc8e8ea78e2fdb1aeba2623f78742bc23f25c717e7c51a37b5f83413a",
        data: "0xdfcfc01b70770a1e4b702f44c26f055e68f223574179120aa3b58901936f3000ce58522de1ac59db35d5136f5190ae038ce8961c95f0aedb0d87a7832e223600ac4ab35",
        index: 2,
      },
      {
        versionedHash:
          "0x01bd6d8096fc5cf0c77e0d7679e184c920cf0f73c0a77ebe089eca3770698c3e",
        txHash:
          "0xd50bf76a030d56a6cec31bf063c38b52cb9cf10331112c7064f5c38f58f29c41",
        commitment:
          "0x8c7ab0971b8c821da8abd02380c6c8f6b18e29895198b15bea220bda58f4b06d7d4621ee5c90d97b00c2f0af92f9b396",
        data: "0xc6371440bf13970de81341fc232948af0533e949a285501c415b54a435539c00a6cb5cef375164ac5a5a65f19696c3ea2055fd154aac37e0159200d26",
        index: 3,
      },
    ],
  });

  console.log(`Blocks inserted: ${blocks.count}`);
  console.log(`Transactions inserted: ${txs.count}`);
  console.log(`Blbos inserted: ${blobs.count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
