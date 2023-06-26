export abstract class BlobStorage {
  abstract getBlob(uri: string): Promise<string>;
  abstract storeBlob(
    chainId: number,
    versionedHash: string,
    data: string,
  ): Promise<string>;

  protected buildBlobFileName(chainId: number, hash: string): string {
    return `${chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6,
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
  }
}
