import { CHAIN_ID } from "./env";

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const HASH_REGEX = /^0x[A-Fa-f0-9]{64}$/;
const COMMITMENT_REGEX = /^0x[A-Fa-f0-9]{96}$/;

function isValidInt(number: number): boolean {
  const minInt = -2147_483_648;
  const maxInt = 2147_483_647;

  return number >= minInt && number <= maxInt;
}

/**
 *
 * Checks if the given string is an address
 */
export function isAddress(address: string): boolean {
  return ADDRESS_REGEX.test(address);
}

/**
 *
 * Checks if the given string is a hash
 */
export function isHash(hash: string): boolean {
  return HASH_REGEX.test(hash);
}

/**
 *
 * Checks if the given string is a KZG commitment
 */
export function isCommitment(commitment: string): boolean {
  return COMMITMENT_REGEX.test(commitment);
}

/**
 *
 * Checks if the given string is a number
 */
export function isBlockNumber(number: string): boolean {
  const number_ = Number(number);

  return !isNaN(number_) && isValidInt(number_);
}

/**
 *
 * Builds a Google Storage URI for the given hash
 *
 */
export function buildGoogleStorageUri(hash: string): string {
  return `${CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(4, 6)}/${hash.slice(
    6,
    8,
  )}/${hash.slice(2)}.blob`;
}
