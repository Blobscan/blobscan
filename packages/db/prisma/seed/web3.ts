import { ETHEREUM_CONFIG } from "@blobscan/eth-config";

import { Rollup } from "../enums";

export const COMMON_MAX_FEE_PER_BLOB_GAS = [
  1000000000, 2, 150000000000, 10, 2000000000, 26000000000, 1, 4000000000, 4,
  10000000000, 80000000000, 50000000000, 56000000000, 8, 65000000000, 20,
  8000000000, 60000000000, 20000000000, 16, 15000000000, 6, 119443524432,
  90741658012, 30, 77553845946, 102084366682, 98154088832, 30000000000,
  5000000000, 176876867046, 134373966794, 129200529966, 139754557944,
  71000000000, 25000000000, 13253037170, 145350598142, 106172020274,
  61277111208, 32, 40, 110423351454, 87248077832, 12000000000, 94375127918,
  31436483250, 151170714642, 41379939894, 74568000282, 58917924626, 29062453216,
  83889001508, 50, 12, 71697110620, 124226272074, 24838702154, 114844914084,
  14200000000, 40000000000, 56649567354, 52371487834, 54468542552, 44760150790,
].map((x) => BigInt(x));

export const ROLLUP_ADDRESSES: Record<Rollup, string> = {
  [Rollup.ARBITRUM]: "0xc1b634853cb333d3ad8663715b08f41a3aec47cc",
  [Rollup.BASE]: "0x5050f69a9786f081509234f1a7f4684b5e5b76c9",
  [Rollup.BLAST]: "0x415c8893d514f9bc5211d36eeda4183226b84aa7",
  [Rollup.BOBA]: "0xe1b64045351b0b6e9821f19b39f81bc4711d2230",
  [Rollup.CAMP]: "0x08f9f14ff43e112b18c96f0986f28cb1878f1d11",
  [Rollup.KROMA]: "0x41b8cd6791de4d8f9e0eaf7861ac506822adce12",
  [Rollup.LINEA]: "0xa9268341831efa4937537bc3e9eb36dbece83c7e",
  [Rollup.METAL]: "0xc94c243f8fb37223f3eb2f7961f7072602a51b8b",
  [Rollup.OPTIMISM]: "0x6887246668a3b87f54deb3b94ba47a6f63f32985",
  [Rollup.OPTOPIA]: "0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5",
  [Rollup.PARADEX]: "0xc70ae19b5feaa5c19f576e621d2bad9771864fe2",
  [Rollup.PGN]: "0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4",
  [Rollup.SCROLL]: "0xcf2898225ed05be911d3709d9417e86e0b4cfc8f",
  [Rollup.STARKNET]: "0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7",
  [Rollup.TAIKO]: "0x000000633b68f5d8d3a86593ebb815b4663bcbe0",
  [Rollup.ZKSYNC]: "0x0d3250c3d5facb74ac15834096397a3ef790ec99",
  [Rollup.MODE]: "0x99199a22125034c808ff20f377d91187e8050f2e",
  [Rollup.ZORA]: "0x625726c858dbf78c0125436c943bf4b4be9d9033",
};

export function fakeExponential(
  factor: bigint,
  numerator: bigint,
  denominator: bigint
): bigint {
  let i = BigInt(1);
  let output = BigInt(0);
  let numerator_accumulator = factor * denominator;

  while (numerator_accumulator > 0) {
    output += numerator_accumulator;
    numerator_accumulator =
      (numerator_accumulator * numerator) / (denominator * i);

    i++;
  }

  return output / denominator;
}

export function getEIP2028CalldataGas(hexData: string) {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = BigInt(0);

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += BigInt(4);
    } else {
      gasCost += BigInt(16);
    }
  }

  return gasCost;
}

export function calculateBlobGasPrice(excessBlobGas: bigint): bigint {
  const { minBlobBaseFee, blobBaseFeeUpdateFraction } =
    ETHEREUM_CONFIG["pectra"];

  return BigInt(
    fakeExponential(minBlobBaseFee, excessBlobGas, blobBaseFeeUpdateFraction)
  );
}

export function calculateExcessBlobGas(
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint
) {
  const targetBlobGasPerBlock = ETHEREUM_CONFIG["pectra"].targetBlobGasPerBlock;
  const excessBlobGas = BigInt(parentExcessBlobGas.toString());
  const blobGasUsed = BigInt(parentBlobGasUsed.toString());

  if (excessBlobGas + blobGasUsed < targetBlobGasPerBlock) {
    return BigInt(0);
  } else {
    return excessBlobGas + blobGasUsed - targetBlobGasPerBlock;
  }
}
