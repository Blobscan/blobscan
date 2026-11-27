import type { PostHog } from "posthog-js";

import { getPostHogUiHost, POSTHOG_PROXY_PATH } from "./posthog-hosts";

/**
 * PostHog, loaded after the page with a dynamic import. It was removed in #968
 * to cut the bundle size; the dynamic import keeps it out of the main bundle,
 * so the page does not wait for it. Every function here does nothing when
 * `PUBLIC_POSTHOG_ID` is not set.
 */

export type NavArrowPage = "blob" | "block" | "tx";

export type NavArrowDirection = "prev" | "next";

export type NavArrowOutcome =
  // The page changed to the adjacent entity.
  | "navigated"
  // There is no entity in that direction (the arrow becomes disabled).
  | "none"
  // Another navigation cancelled the page change.
  | "cancelled"
  | "error";

// Properties that only some pages send.
export type NavArrowExtraProperties = {
  // Blob: within the transaction, or to another transaction of the sender.
  same_transaction?: boolean;
  // Blob: how many transactions carry the blob the user leaves.
  blob_transaction_count?: number;
};

/**
 * Every event that the app sends, with its properties. Add an event here
 * before capturing it. Use type aliases, not interfaces: PostHog needs
 * properties with an index signature.
 */
export type AnalyticsEvents = {
  nav_arrow_click: {
    page: NavArrowPage;
    direction: NavArrowDirection;
    outcome: NavArrowOutcome;
    // From the click to the new page.
    duration_ms: number;
  } & NavArrowExtraProperties;
};

export type AnalyticsEvent = keyof AnalyticsEvents;

let client: PostHog | undefined;
let loading: Promise<void> | undefined;
// Set when PostHog could not load: events are dropped from then on.
let failed = false;

// Events captured before PostHog has loaded. Bounded, so that a load that never
// ends does not keep them forever.
const MAX_PENDING_EVENTS = 50;
const pendingEvents: {
  [E in AnalyticsEvent]: [E, AnalyticsEvents[E]];
}[AnalyticsEvent][] = [];

/**
 * Loads PostHog once. Returns the load, which never rejects, so that callers
 * (and tests) can wait for it.
 */
export function initAnalytics({
  id,
  host,
  proxy,
}: {
  id: string;
  host: string;
  // Send the requests through the relay of this site instead of to `host`.
  proxy: boolean;
}): Promise<void> | undefined {
  if (typeof window === "undefined" || loading) {
    return loading;
  }

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(id, {
        ...(proxy
          ? { api_host: POSTHOG_PROXY_PATH, ui_host: getPostHogUiHost(host) }
          : { api_host: host }),
        person_profiles: "identified_only",
        // Next.js changes pages without a page load: count each URL change.
        capture_pageview: "history_change",
        // No cookie: the anonymous id is kept in localStorage only.
        persistence: "localStorage",
        // Only the page views and the events that the app sends. These
        // features record what the user does on the page, or load extra
        // scripts, whatever the PostHog project settings say.
        autocapture: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        // Sentry reports the errors.
        capture_exceptions: false,
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

export function captureEvent<E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEvents[E]
) {
  if (client) {
    client.capture(event, properties);

    return;
  }

  if (loading && !failed && pendingEvents.length < MAX_PENDING_EVENTS) {
    pendingEvents.push([event, properties]);
  }
}

/**
 * Captures one event per click on a previous/next arrow of a details page,
 * with what the click did and how long it took (request plus page change).
 */
export function captureNavArrowClick({
  page,
  direction,
  outcome,
  startedAt,
  properties = {},
}: {
  page: NavArrowPage;
  direction: NavArrowDirection;
  outcome: NavArrowOutcome;
  startedAt: number;
  properties?: NavArrowExtraProperties;
}) {
  captureEvent("nav_arrow_click", {
    page,
    direction,
    outcome,
    duration_ms: Math.round(performance.now() - startedAt),
    ...properties,
  });
}
