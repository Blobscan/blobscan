export type DecodableRollup = "STARKNET";

export type BlobDecoderFn<R> = (blobData: string) => R;
