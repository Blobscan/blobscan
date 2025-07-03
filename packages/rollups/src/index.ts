import { Rollup } from "@blobscan/db/prisma/enums";

export const ADDRESS_TO_ROLLUP_MAPPINGS: Map<
  number,
  Map<string, Rollup>
> = new Map([
  // Mainnet
  [
    1,
    new Map([
      ["0x11805594be0229ef08429d775af0c55f7c4535de", Rollup.ABSTRACT],
      ["0x889e21d7ba3d6dd62e75d4980a4ad1349c61599d", Rollup.AEVO],
      ["0x6079e9c37b87fe06d0bde2431a0fa309826c9b67", Rollup.ANCIENT8],
      ["0xc1b634853cb333d3ad8663715b08f41a3aec47cc", Rollup.ARBITRUM],
      ["0x2b8733e8c60a928b19bb7db1d79b918e8e09ac8c", Rollup.ARENAZ],
      ["0x5050f69a9786f081509234f1a7f4684b5e5b76c9", Rollup.BASE],
      ["0x415c8893d514f9bc5211d36eeda4183226b84aa7", Rollup.BLAST],
      ["0xe1b64045351b0b6e9821f19b39f81bc4711d2230", Rollup.BOBA],
      ["0x08f9f14ff43e112b18c96f0986f28cb1878f1d11", Rollup.CAMP],
      ["0x7ab7da0c3117d7dfe0abfaa8d8d33883f8477c74", Rollup.DEBANKCHAIN],
      ["0x43ca061ea80fbb4a2b5515f4be4e953b191147af", Rollup.ETHERNITY],
      ["0x6017f75108f251a488b045a7ce2a7c15b179d1f2", Rollup.FRAXTAL],
      ["0xea0337efc12e98ab118948da570c07691e8e4b37", Rollup.FUEL],
      ["0x9391791f7cb74f8bfda65edc0749efd964311b55", Rollup.HASHKEY],
      ["0x65115c6d23274e0a29a63b69130efe901aa52e7a", Rollup.HEMI],
      ["0x994c288de8418c8d3c5a4d21a69f35bf9641781c", Rollup.HYPR],
      ["0xebac13ec21937c6eb2b65eb970dbdaca56c9c8b8", Rollup.INFINAEON],
      ["0x500d7ea63cf2e501dadaa5feec1fc19fe2aa72ac", Rollup.INK],
      ["0x84bdfb21ed7c8b332a42bfd595744a84f3101e4e", Rollup.KARAK],
      ["0xe27f3f6db6824def1738b2aace2672ac59046a39", Rollup.KINTO],
      ["0x41b8cd6791de4d8f9e0eaf7861ac506822adce12", Rollup.KROMA],
      ["0xdec273bf31ad79ad00d619c52662f724176a12fb", Rollup.LAMBDA],
      ["0xa9268341831efa4937537bc3e9eb36dbece83c7e", Rollup.LINEA],
      ["0x46d2f319fd42165d4318f099e143dea8124e9e3e", Rollup.LINEA],
      ["0xa6ea2f3299b63c53143c993d2d5e60a69cd6fe24", Rollup.LISK],
      ["0xa76e31d8471d569efdd3d95d1b11ce6710f4533f", Rollup.MANTA],
      ["0x2f6afe2e3fea041b892a6e240fd1a0e5b51e8376", Rollup.MANTLE],
      ["0xcdf02971871b7736874e20b8487c019d28090019", Rollup.METIS],
      ["0xc94c243f8fb37223f3eb2f7961f7072602a51b8b", Rollup.METAL],
      ["0xee12c640b0793cf514e42ea1c428bd5399545d4d", Rollup.METAMAIL],
      ["0x68bdfece01535090c8f3c27ec3b1ae97e83fa4aa", Rollup.MINT],
      ["0x34e387b37d3adeaa6d5b92ce30de3af3dca39796", Rollup.MORPH],
      ["0x61f2945d4bc9e40b66a6376d1094a50438f613e2", Rollup.MORPH],
      ["0x6ab0e960911b50f6d14f249782ac12ec3e7584a0", Rollup.MORPH],
      ["0xa59b26db10c5ca26a97aa2fd2e74cb8da9d1eb65", Rollup.MORPH],
      ["0xb6cf39ee72e0127e6ea6059e38b8c197227a6ac7", Rollup.MORPH],
      ["0xbba36cdf020788f0d08d5688c0bee3fb30ce1c80", Rollup.MORPH],
      ["0xf834ffbeb6bb3f4841afc6b5fb40b94cd580fa23", Rollup.MORPH],
      ["0x99199a22125034c808ff20f377d91187e8050f2e", Rollup.MODE],
      ["0xb1b676357de100c5bd846299cf6c85436803e839", Rollup.NAL],
      ["0xe42aa6d07e28655bc060251d6ccbb1368e4333fd", Rollup.NANONNETWORK],
      ["0x1fd6a75cc72f39147756a663f3ef1fc95ef89495", Rollup.OPBNB],
      ["0x6887246668a3b87f54deb3b94ba47a6f63f32985", Rollup.OPTIMISM],
      ["0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5", Rollup.OPTOPIA],
      ["0xf8db8aba597ff36ccd16fecfbb1b816b3236e9b8", Rollup.ORDERLY],
      ["0x4d875acfd836eb3d8a2f25ba03de16c97ec9fc0f", Rollup.PANDASEA],
      ["0xf4559766b24402f0fff8fc5a6835d5f6e837aed3", Rollup.PANDASEA],
      ["0xc70ae19b5feaa5c19f576e621d2bad9771864fe2", Rollup.PARADEX],
      ["0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4", Rollup.PARALLEL],
      ["0x40acdc94a00b33151b40763b3fed7c46ff639df4", Rollup.PARALLEL],
      ["0x99526b0e49a95833e734eb556a6abaffab0ee167", Rollup.PGN],
      ["0x9fb23129982c993743eb9bb156af8cc8fa2ac761", Rollup.PHALA],
      ["0x67a44ce38627f46f20b1293960559ed85dd194f1", Rollup.POLYNOMIAL],
      ["0x8cda8351236199af7532bad53d683ddd9b275d89", Rollup.RACE],
      ["0x52ee324f2bcd0c5363d713eb9f62d1ee47266ac1", Rollup.RIVER],
      ["0x2986bf308d0684ad77cd32ee1c60429e6573b5af", Rollup.R0AR],
      ["0xf263a0aa8afeaa7d516b596d49d7ba6c0feb102c", Rollup.R0AR],
      ["0xcf2898225ed05be911d3709d9417e86e0b4cfc8f", Rollup.SCROLL],
      ["0x054a47b9e2a22af6c0ce55020238c8fecd7d334b", Rollup.SCROLL],
      ["0xf7ca543d652e38692fd12f989eb55b5327ec9a20", Rollup.SHAPE],
      ["0x060b915ca4904b56ada63565626b9c97f6cad212", Rollup.SNAXCHAIN],
      ["0x6776be80dbada6a02b5f2095cf13734ac303b8d1", Rollup.SONEIUM],
      ["0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7", Rollup.STARKNET],
      ["0x5c53f2ff1030c7fbc0616fd5b8fc6be97aa27e00", Rollup.SUPERLUMIO],
      ["0xa9b074b27de97f492f8f07fd7c213400e4ca5391", Rollup.SUPERSEED],
      ["0xf854cd5b26bfd73d51236c0122798907ed65b1f2", Rollup.SWELLCHAIN],
      ["0xde794bec196832474f2f218135bfd0f7ca7fb038", Rollup.SWANCHAIN],
      ["0x000000633b68f5d8d3a86593ebb815b4663bcbe0", Rollup.TAIKO],
      ["0x7f9d9c1bce1062e1077845ea39a0303429600a06", Rollup.THEBINARYHOLDINGS],
      ["0x68d5BBf3a01ECbB47CE38Cf64a7d6C0eA618040f", Rollup.THEBINARYHOLDINGS],
      ["0x2f60a5184c63ca94f82a27100643dbabe4f3f7fd", Rollup.UNICHAIN],
      ["0xdbbe3d8c2d2b22a2611c5a94a9a12c2fcd49eb29", Rollup.WORLD],
      ["0x90680f0f6d63060fb7a16bdc722a85b992dd5047", Rollup.XGA],
      ["0x0d3250c3d5facb74ac15834096397a3ef790ec99", Rollup.ZKSYNC],
      ["0xaf1e4f6a47af647f87c0ec814d8032c4a4bff145", Rollup.ZIRCUIT],
      ["0x479b7c95b9509e1a834c994fc94e3581aa8a73b9", Rollup.ZERONETWORK],
      ["0x625726c858dbf78c0125436c943bf4b4be9d9033", Rollup.ZORA],
    ]),
  ],
  // Holesky
  [17000, new Map()],
  // Sepolia
  [
    11155111,
    new Map([
      ["0x564D33DE40b1af31aAa2B726Eaf9Dafbaf763577", Rollup.ABSTRACT],
      ["0xb2248390842d3c4acf1d8a893954afc0eac586e5", Rollup.ARBITRUM],
      ["0x1fb1494f5135bb01a698fb3e863dd12f876bb085", Rollup.ARBITRUM],
      ["0x07f0e1ec1ce152b075fda4a827a9f17851086b25", Rollup.ARBITRUM],
      ["0xfc56e7272eebbba5bc6c544e159483c4a38f8ba3", Rollup.BASE],
      ["0x6cdebe940bc0f26850285caca097c11c33103e47", Rollup.BASE],
      ["0xf15dc770221b99c98d4aaed568f2ab04b9d16e42", Rollup.KROMA],
      ["0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38", Rollup.LINEA],
      ["0x88584cf948cd51267f220edd9e21e67ccf3fcfa8", Rollup.LINEA],
      ["0x4e6bd53883107b063c502ddd49f9600dc51b3ddc", Rollup.MODE],
      ["0x18Df96b5f89bd1452554382d88017c424704Ae04", Rollup.NAL],
      ["0x8f23bb38f531600e5d8fddaaec41f13fab46e98c", Rollup.OPTIMISM],
      ["0xdf50ccaa4467b61b51d8ed86320d8ca67a56265e", Rollup.OPTIMISM],
      ["0xe14b3f075ad9377689daf659e04a2a99a4acede4", Rollup.OPTIMISM],
      ["0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0", Rollup.SCROLL],
      ["0x0f3ff4731D7a10B89ED79AD1Fd97844d7F66B96d", Rollup.WORLD],
      ["0x5b98b836969a60fec50fa925905dd1d382a7db43", Rollup.STARKNET],
      ["0xa07FA473B87D7ADee161f458aF300255B65F33f6", Rollup.ZIRCUIT],
      ["0x3cd868e221a3be64b161d596a7482257a99d857f", Rollup.ZORA],
    ]),
  ],
  // Gnosis
  [100, new Map()],
  // Hoodi
  [560048, new Map()],
]);

export const ROLLUP_TO_ADDRESSES_MAPPINGS = new Map(
  [...ADDRESS_TO_ROLLUP_MAPPINGS.entries()].map(
    ([chainId, addressToRollupMapping]) => [
      chainId,
      new Map(
        [...addressToRollupMapping.entries()].reduce<Map<Rollup, string[]>>(
          (rollupToAddresses, [address, rollup]) => {
            if (!rollupToAddresses.has(rollup)) {
              rollupToAddresses.set(rollup, []);
            }

            rollupToAddresses.get(rollup)?.push(address);

            return rollupToAddresses;
          },
          new Map()
        )
      ),
    ]
  )
);

export function getChainRollups(chainId: number): [Rollup, string[]][] {
  const addressToRollupMapping = ROLLUP_TO_ADDRESSES_MAPPINGS.get(chainId);

  if (!addressToRollupMapping) {
    return [];
  }

  return Array.from(addressToRollupMapping.entries());
}

export function getRollupByAddress(
  address: string,
  chainId: number | string
): Rollup | null {
  const normalizedChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;
  const normalizedAddress = address.toLowerCase();
  const addressToRollupMapping =
    ADDRESS_TO_ROLLUP_MAPPINGS.get(normalizedChainId);

  if (!addressToRollupMapping) {
    return null;
  }

  return addressToRollupMapping.get(normalizedAddress) || null;
}

export function getAddressesByRollup(
  rollup: Rollup,
  chainId: number | string
): string[] | null {
  const normalizedChainId =
    typeof chainId === "string" ? parseInt(chainId) : chainId;
  const rollupMapping = ROLLUP_TO_ADDRESSES_MAPPINGS.get(normalizedChainId);

  if (!rollupMapping) {
    return null;
  }

  return rollupMapping.get(rollup) || null;
}

export * from "./styles";
