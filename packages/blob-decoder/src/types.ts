export type Decoder = "starknet";

export type BlobDecoderFn<R> = (blobData: string) => R;
