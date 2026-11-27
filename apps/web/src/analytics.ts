import type { PostHog, Properties } from "posthog-js";

/**
 * PostHog, loaded after the page with a dynamic import. It was removed in #968
 * to cut the bundle size; the dynamic import keeps it out of the main bundle,
 * so the page does not wait for it. Every function here does nothing when
 * `PUBLIC_POSTHOG_ID` is not set.
 */

let client: PostHog | undefined;
let loading: Promise<void> | undefined;
// Set when PostHog could not load: events are dropped from then on.
let failed = false;

// Events captured before PostHog has loaded. Bounded, so that a load that never
// ends does not keep them forever.
const MAX_PENDING_EVENTS = 50;
const pendingEvents: [string, Properties][] = [];

/**
 * Loads PostHog once. Returns the load, which never rejects, so that callers
 * (and tests) can wait for it.
 */
export function initAnalytics({
  id,
  host,
}: {
  id: string;
  host: string;
}): Promise<void> | undefined {
  if (typeof window === "undefined" || loading) {
    return loading;
  }

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(id, {
        api_host: host,
        person_profiles: "identified_only",
        // Next.js changes pages without a page load: count each URL change.
        capture_pageview: "history_change",
        loaded: (instance) => {
          if (window.location.hostname.includes("localhost")) {
            instance.debug();
          }
        },
      });

      client = posthog;

      for (const [event, properties] of pendingEvents.splice(0)) {
        posthog.capture(event, properties);
      }
    })
    .catch(() => {
      // Blocked by an ad blocker or offline: analytics must never break the
      // page.
      failed = true;
      pendingEvents.length = 0;
    });

  return loading;
}

export function captureEvent(event: string, properties: Properties = {}) {
  if (client) {
    client.capture(event, properties);

    return;
  }

  if (loading && !failed && pendingEvents.length < MAX_PENDING_EVENTS) {
    pendingEvents.push([event, properties]);
  }
}

export type NavArrowPage = "blob" | "block" | "tx";

export type NavArrowOutcome =
  // The page changed to the adjacent entity.
  | "navigated"
  // There is no entity in that direction (the arrow becomes disabled).
  | "none"
  // Another navigation cancelled the page change.
  | "cancelled"
  | "error";

/**
 * One event per click on a previous/next arrow of a details page, with what
 * the click did and how long it took (request plus page change).
 */
export function captureNavArrowClick({
  page,
  direction,
  outcome,
  startedAt,
  properties = {},
}: {
  page: NavArrowPage;
  direction: "prev" | "next";
  outcome: NavArrowOutcome;
  startedAt: number;
  properties?: Properties;
}) {
  captureEvent("nav_arrow_click", {
    page,
    direction,
    outcome,
    duration_ms: Math.round(performance.now() - startedAt),
    ...properties,
  });
}
