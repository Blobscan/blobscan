import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import UpstashFeedbackWidget from "@upstash/feedback";
import { useTheme } from "next-themes";

export const FeedbackWidget: React.FC = function () {
  const { pathname, query } = useRouter();
  const { resolvedTheme } = useTheme();
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    async function fetchFeedbackStatus() {
      const res = await fetch("/api/feedback/status");
      const { enabled } = (await res.json()) as { enabled: boolean };

      setDisplay(enabled);
    }

    fetchFeedbackStatus();
  }, []);

  if (!display) {
    return null;
  }

  return (
    <div className="text-content-light">
      <UpstashFeedbackWidget
        type="full"
        // We need to specify the api path to be absolute to
        // solve: https://github.com/upstash/feedback/issues/5
        apiPath="/api/feedback"
        themeColor={resolvedTheme === "dark" ? "#9A71F2" : "#5D25D4"}
        textColor="#FFF"
        title="Hi 👋"
        description="Have feedback? We'd love to hear it"
        user="anon"
        metadata={{
          pathname: pathname,
          query: query,
        }}
      />
    </div>
  );
};
