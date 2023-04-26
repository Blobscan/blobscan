const NUMBER_REGEX = /^[0-9]+$/;
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const HASH_REGEX = /^0x[A-Fa-f0-9]{64}$/;
const COMMITMENT_REGEX = /^0x[A-Fa-f0-9]{96}$/;

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
export function isNumber(number: string): boolean {
  return NUMBER_REGEX.test(number);
}
