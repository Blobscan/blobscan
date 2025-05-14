import { BatchId, PrivateKey } from "@ethersphere/bee-js";
import type { Chunk } from "cafe-utility";
import { Binary, Elliptic } from "cafe-utility";

export class Stamper {
  signer: PrivateKey;
  batchId: Uint8Array;
  buckets: Uint32Array;
  depth: number;
  maxSlot: number;
  address: Uint8Array;

  private constructor(
    signer: bigint,
    batchId: Uint8Array,
    buckets: Uint32Array,
    depth: number
  ) {
    this.signer = new PrivateKey(Binary.numberToUint256(signer, "BE"));
    this.batchId = batchId;
    this.buckets = buckets;
    this.depth = depth;
    this.maxSlot = 2 ** (this.depth - 16);
    const publicKey = Elliptic.privateKeyToPublicKey(signer);
    this.address = Elliptic.publicKeyToAddress(publicKey);
  }

  static fromBlank(signer: bigint, batchId: Uint8Array, depth: number) {
    return new Stamper(signer, batchId, new Uint32Array(65536), depth);
  }

  static fromState(
    signer: bigint,
    batchId: Uint8Array,
    buckets: Uint32Array,
    depth: number
  ) {
    return new Stamper(signer, batchId, buckets, depth);
  }

  stamp(chunk: Chunk) {
    const address = chunk.hash();
    const bucket = Binary.uint16ToNumber(address, "BE");

    const height = this.buckets[bucket];
    if (this.buckets[bucket]) this.buckets[bucket]++;

    const index = Binary.concatBytes(
      Binary.numberToUint32(bucket, "BE"),
      Binary.numberToUint32(height ?? 0, "BE")
    );
    const timestamp = Binary.numberToUint64(BigInt(Date.now()), "BE");
    const message = Binary.concatBytes(address, this.batchId, index, timestamp);
    const signature = this.signer.sign(message);

    return {
      batchId: new BatchId(this.batchId),
      index,
      issuer: this.address,
      signature: signature.toUint8Array(),
      timestamp,
    };
  }

  getState(): Uint32Array {
    return this.buckets;
  }
}
