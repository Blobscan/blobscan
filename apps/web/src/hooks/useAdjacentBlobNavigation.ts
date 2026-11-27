import { useCallback, useState } from "react";
import { useRouter } from "next/compat/router";
import { skipToken, useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";

import { api } from "~/api-client";
import { routes } from "~/routes";
import type { BlobPosition, BlobV1, GetAdjacentBlobInput } from "~/types";

export const BLOB_EXPAND = "transaction";
// The blob page lists the transactions of the blob with cursor pagination
// (`/v1/blobs?blob=`), this many at a time (the maximum of `ps`). Some blobs
// are in tens of thousands of transactions; the page with all of them was a
// 54 MB response.
export const BLOB_TRANSACTIONS_PAGE_SIZE = 100;
// The blob responses can have signed storage URLs that expire after one hour,
// so the page does not use a cached blob that is older than this time.
export const BLOB_STALE_TIME = 5 * 60 * 1000;

type Direction = GetAdjacentBlobInput["direction"];

/**
 * The input of the `getByBlobIdV1` query of the blob page. `getAdjacentBlob`
 * returns the blob in the same format, so its result goes in the cache entry
 * of this input.
 */
export function toBlobPageQueryInput(id: string) {
  return { id };
}

// The page gets an adjacent blob only when the user clicks an arrow. These
// queries do not send a request. They only read the cache that the click
// fills, so an arrow becomes disabled when its result is `null`.
const CACHE_ONLY_OPTIONS = { enabled: false, staleTime: Infinity } as const;

function toAdjacentBlobInput(
  { txHash, index }: BlobPosition,
  direction: Direction
): GetAdjacentBlobInput {
  return { txHash, index, direction };
}

/**
 * Gets the previous or the next blob of the sender when the user clicks an
 * arrow, puts it in the cache of its page and goes to that page.
 */
export function useAdjacentBlobNavigation({
  blob,
  blobUpdatedAt,
  position,
}: {
  blob: BlobV1 | undefined;
  blobUpdatedAt: number;
  position: BlobPosition | undefined;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const { data: prevBlob } = api.blob.getAdjacentBlob.useQuery(
    position ? toAdjacentBlobInput(position, "prev") : skipToken,
    CACHE_ONLY_OPTIONS
  );
  const { data: nextBlob } = api.blob.getAdjacentBlob.useQuery(
    position ? toAdjacentBlobInput(position, "next") : skipToken,
    CACHE_ONLY_OPTIONS
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const navigate = useCallback(
    async (direction: Direction) => {
      if (!blob || !position) {
        return;
      }

      setLoading(true);
      setError(undefined);

      try {
        const adjacentInput = toAdjacentBlobInput(position, direction);
        // `fetch` sends a request if the cached result is older than
        // `BLOB_STALE_TIME`. Do not use `ensureData`: it always returns the
        // cached result, also when it is old.
        const adjacent = await utils.blob.getAdjacentBlob.fetch(adjacentInput, {
          staleTime: BLOB_STALE_TIME,
        });

        if (!adjacent) {
          return;
        }

        // Put the adjacent blob in the cache of its page, so that the page
        // does not send a second request. The cache entries keep the time of
        // the request, so that an old blob does not show as new.
        const adjacentUpdatedAt = queryClient.getQueryState(
          getQueryKey(api.blob.getAdjacentBlob, adjacentInput, "query")
        )?.dataUpdatedAt;

        utils.blob.getByBlobIdV1.setData(
          toBlobPageQueryInput(adjacent.blob.versionedHash),
          adjacent.blob,
          { updatedAt: adjacentUpdatedAt }
        );
        // In the same transaction, the current blob is the adjacent blob of
        // the new page in the opposite direction. Do not do this for a
        // different transaction: if the current transaction is in a reorged
        // block, the search in the opposite direction does not return it.
        if (adjacent.txHash === position.txHash) {
          utils.blob.getAdjacentBlob.setData(
            toAdjacentBlobInput(
              adjacent,
              direction === "next" ? "prev" : "next"
            ),
            { ...position, blob },
            { updatedAt: blobUpdatedAt }
          );
        }

        await router?.push(routes.blob(adjacent.blob.versionedHash, adjacent));
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Could not get the blob")
        );
      } finally {
        setLoading(false);
      }
    },
    [blob, blobUpdatedAt, position, queryClient, router, utils]
  );

  return { prevBlob, nextBlob, loading, error, navigate };
}
