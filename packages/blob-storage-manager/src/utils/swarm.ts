import type { Bee } from "@ethersphere/bee-js";
import { AsyncQueue, Binary, Chunk, MerkleTree } from "cafe-utility";
import fs from "fs";
import createKeccakHash from "keccak";
import Web3 from "web3";

import { env } from "@blobscan/env";

import { Stamper } from "./Stamper";

Chunk.hashFunction = (data: Uint8Array): Uint8Array =>
  createKeccakHash("keccak256").update(Buffer.from(data)).digest();

interface UploadOptions {
  data: string | Buffer;
  bee: Bee;
  batchIdString: string;
}

function requireEnv(
  name: string,
  value: string | number | undefined
): string | number {
  if (!value) {
    throw new Error(
      `Missing Swarm configuration environment variable: ${name}`
    );
  }
  return value;
}

function getSwarmEnv() {
  return {
    depth: requireEnv("SWARM_BATCH_DEPTH", env.SWARM_BATCH_DEPTH),
    keystorePath: requireEnv("SWARM_KEYSTORE_PATH", env.SWARM_KEYSTORE_PATH),
    keystorePassword: requireEnv(
      "SWARM_KEYSTORE_PASSWORD",
      env.SWARM_KEYSTORE_PASSWORD
    ),
  };
}

const { depth, keystorePath, keystorePassword } = getSwarmEnv();

export async function uploadWithStamping({
  data,
  bee,
  batchIdString,
}: UploadOptions): Promise<string> {
  const batchId = Binary.hexToUint8Array(batchIdString);
  const stampStatePath = `${batchIdString}.bin`;
  const web3 = new Web3();

  const keystore = JSON.parse(fs.readFileSync(keystorePath, "utf-8"));
  const account = await web3.eth.accounts.decrypt(
    keystore,
    keystorePassword as string
  );
  const privateKey = BigInt(account.privateKey);

  const stamper = fs.existsSync(stampStatePath)
    ? Stamper.fromState(
        privateKey,
        batchId,
        new Uint32Array(fs.readFileSync(stampStatePath)),
        depth as number
      )
    : Stamper.fromBlank(privateKey, batchId, depth as number);

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const queue = new AsyncQueue(64, 64);

  const tree = new MerkleTree(async (chunk) => {
    await queue.enqueue(async () => {
      const envelope = stamper.stamp(chunk);
      await bee.uploadChunk(envelope, chunk.build(), {
        deferred: env.SWARM_DEFERRED_UPLOAD,
      });
    });
  });

  await tree.append(buffer);
  const reference = await tree.finalize();
  await queue.drain();

  fs.writeFileSync(stampStatePath, stamper.getState());

  return Array.from(reference.hash())
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
