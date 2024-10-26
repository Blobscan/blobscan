import type { FC } from "react";
import React, { useEffect, useState } from "react";

import Chat from "~/icons/chat.svg";
import { Button } from "../Button";
import { FeedbackCard } from "./FeedbackCard";

export const FeedbackWidget: FC = () => {
  const [open, setOpen] = useState(false);
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
    <>
      <div className="fixed bottom-8 right-8">
        <Button
          className="flex items-center justify-center gap-2"
          onClick={() => setOpen((prev) => !prev)}
        >
          Feedback <Chat className="h-5 w-5" />
        </Button>
      </div>
      <FeedbackCard open={open} onClose={() => setOpen(false)} />
    </>
  );
};
