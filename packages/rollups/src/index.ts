import { Rollup } from "@blobscan/db/prisma/enums";

export const ADDRESS_TO_ROLLUP_MAPPINGS: Map<
  number,
  Map<string, Rollup>
> = new Map([
  // Mainnet
  [
    1,
    new Map([
      ["0xc1b634853cb333d3ad8663715b08f41a3aec47cc", Rollup.ARBITRUM],
      ["0x5050f69a9786f081509234f1a7f4684b5e5b76c9", Rollup.BASE],
      ["0x415c8893d514f9bc5211d36eeda4183226b84aa7", Rollup.BLAST],
      ["0xe1b64045351b0b6e9821f19b39f81bc4711d2230", Rollup.BOBA],
      ["0x08f9f14ff43e112b18c96f0986f28cb1878f1d11", Rollup.CAMP],
      ["0x41b8cd6791de4d8f9e0eaf7861ac506822adce12", Rollup.KROMA],
      ["0xa9268341831efa4937537bc3e9eb36dbece83c7e", Rollup.LINEA],
      ["0xc94c243f8fb37223f3eb2f7961f7072602a51b8b", Rollup.METAL],
      ["0x6887246668a3b87f54deb3b94ba47a6f63f32985", Rollup.OPTIMISM],
      ["0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5", Rollup.OPTOPIA],
      ["0xc70ae19b5feaa5c19f576e621d2bad9771864fe2", Rollup.PARADEX],
      ["0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4", Rollup.PGN],
      ["0xcf2898225ed05be911d3709d9417e86e0b4cfc8f", Rollup.SCROLL],
      ["0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7", Rollup.STARKNET],
      ["0x000000633b68f5d8d3a86593ebb815b4663bcbe0", Rollup.TAIKO],
      ["0x0d3250c3d5facb74ac15834096397a3ef790ec99", Rollup.ZKSYNC],
      ["0x99199a22125034c808ff20f377d91187e8050f2e", Rollup.MODE],
      ["0x625726c858dbf78c0125436c943bf4b4be9d9033", Rollup.ZORA],
    ]),
  ],
  // Holesky
  [17000, new Map()],
  // Sepolia
  [
    11155111,
    new Map([
      ["0xb2248390842d3c4acf1d8a893954afc0eac586e5", Rollup.ARBITRUM],
      ["0x1fb1494f5135bb01a698fb3e863dd12f876bb085", Rollup.ARBITRUM],
      ["0x07f0e1ec1ce152b075fda4a827a9f17851086b25", Rollup.ARBITRUM],
      ["0xfc56e7272eebbba5bc6c544e159483c4a38f8ba3", Rollup.BASE],
      ["0x6cdebe940bc0f26850285caca097c11c33103e47", Rollup.BASE],
      ["0xf15dc770221b99c98d4aaed568f2ab04b9d16e42", Rollup.KROMA],
      ["0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38", Rollup.LINEA],
      ["0x88584cf948cd51267f220edd9e21e67ccf3fcfa8", Rollup.LINEA],
      ["0x8f23bb38f531600e5d8fddaaec41f13fab46e98c", Rollup.OPTIMISM],
      ["0xdf50ccaa4467b61b51d8ed86320d8ca67a56265e", Rollup.OPTIMISM],
      ["0xe14b3f075ad9377689daf659e04a2a99a4acede4", Rollup.OPTIMISM],
      ["0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0", Rollup.SCROLL],
      ["0x5b98b836969a60fec50fa925905dd1d382a7db43", Rollup.STARKNET],
      ["0x4e6bd53883107b063c502ddd49f9600dc51b3ddc", Rollup.MODE],
      ["0x3cd868e221a3be64b161d596a7482257a99d857f", Rollup.ZORA],
    ]),
  ],
  // Gnosis
  [100, new Map()],
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

export function getChainRollups(chainId: number): [string, Rollup][] {
  const addressToRollupMapping = ADDRESS_TO_ROLLUP_MAPPINGS.get(chainId);

  if (!addressToRollupMapping) {
    return [];
  }

  return Array.from(addressToRollupMapping.entries());
}

export function getRollupByAddress(
  address: string,
  chainId: number
): Rollup | null {
  const normalizedAddress = address.toLowerCase();
  const addressToRollupMapping = ADDRESS_TO_ROLLUP_MAPPINGS.get(chainId);

  if (!addressToRollupMapping) {
    return null;
  }

  return addressToRollupMapping.get(normalizedAddress) || null;
}

export function getAddressesByRollup(
  rollup: Rollup,
  chainId: number
): string[] | null {
  const rollupMapping = ROLLUP_TO_ADDRESSES_MAPPINGS.get(chainId);

  if (!rollupMapping) {
    return null;
  }

  return rollupMapping.get(rollup) || null;
}
