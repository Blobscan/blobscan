"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { env } from "~/env.mjs";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!env.NEXT_PUBLIC_POSTHOG_ID) {
      return;
    }

    posthog.init(env.NEXT_PUBLIC_POSTHOG_ID, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false,
      loaded: (posthog) => {
        if (env.NODE_ENV === "development") {
          posthog.debug();
        }
      },
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
