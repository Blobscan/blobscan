import { createHash } from "crypto";

import { routes } from "./routes";

const VERSIONED_HASH_REGEX = /^0x01[a-f0-9]{62}$/;
const COMMITMENT_REGEX = /^0x[a-f0-9]{96}$/;

function toVersionedHash(commitment: string) {
  const hashedCommitment = createHash("sha256")
    .update(commitment.slice(2), "hex")
    .digest("hex");

  return `0x01${hashedCommitment.slice(2)}`;
}

/**
 * Gets the absolute canonical URL of a blob page from the blob id in the
 * route. The id can be a versioned hash or a KZG commitment. The canonical URL
 * always uses the versioned hash and has no position (`?tx=&index=`).
 *
 * This function does not read the database. Thus the server can put the URL
 * in the HTML before the blob loads. Returns `undefined` if the id is not
 * valid or if there is no origin.
 *
 * Use it only on the server: it imports the `crypto` module of Node.js.
 */
export function getBlobCanonicalUrl(
  id: string | undefined,
  origin: string | undefined
): string | undefined {
  if (!id || !origin) {
    return;
  }

  let versionedHash: string | undefined;

  if (VERSIONED_HASH_REGEX.test(id)) {
    versionedHash = id;
  } else if (COMMITMENT_REGEX.test(id)) {
    versionedHash = toVersionedHash(id);
  }

  if (!versionedHash) {
    return;
  }

  return new URL(routes.blob(versionedHash), origin).toString();
}
