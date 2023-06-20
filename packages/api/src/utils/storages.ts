import { env } from "../env";

/**
 *
 * Builds a Google Storage URI for the given hash
 *
 */
export function buildGoogleStorageUri(hash: string): string {
  return `${env.CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(4, 6)}/${hash.slice(
    6,
    8,
  )}/${hash.slice(2)}.txt`;
}
