import { useCallback, useState } from "react";
import { useRouter } from "next/compat/router";

import { captureNavArrowClick } from "~/analytics";
import type {
  NavArrowDirection,
  NavArrowExtraProperties,
  NavArrowPage,
} from "~/analytics";

export type AdjacentDirection = NavArrowDirection;

export interface AdjacentTarget {
  // The page of the adjacent entity.
  route: string;
  // Extra properties of the `nav_arrow_click` event.
  properties?: NavArrowExtraProperties;
}

/**
 * Gets the adjacent entity in a direction, puts it in the cache of its page
 * and returns where to go, or `null` when there is no entity in that
 * direction.
 */
export type GetAdjacent = (
  direction: AdjacentDirection
) => Promise<AdjacentTarget | null>;

/**
 * The previous/next arrows of a details page: gets the adjacent entity, goes
 * to its page and sends one `nav_arrow_click` event per click. Pass
 * `getAdjacent` as `undefined` while the current entity is not loaded: a
 * click then does nothing.
 */
export function useAdjacentNavigation({
  page,
  getAdjacent,
  errorMessage,
}: {
  page: NavArrowPage;
  getAdjacent: GetAdjacent | undefined;
  errorMessage: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const navigate = useCallback(
    async (direction: AdjacentDirection) => {
      if (!getAdjacent) {
        return;
      }

      setLoading(true);
      setError(undefined);

      const startedAt = performance.now();

      try {
        const target = await getAdjacent(direction);

        if (!target) {
          captureNavArrowClick({ page, direction, outcome: "none", startedAt });

          return;
        }

        const navigated = await router?.push(target.route);

        captureNavArrowClick({
          page,
          direction,
          // `push` resolves `false` when another navigation cancels it.
          outcome: navigated === false ? "cancelled" : "navigated",
          startedAt,
          properties: target.properties,
        });
      } catch (err) {
        captureNavArrowClick({ page, direction, outcome: "error", startedAt });
        setError(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    },
    [errorMessage, getAdjacent, page, router]
  );

  return { navigate, loading, error };
}
