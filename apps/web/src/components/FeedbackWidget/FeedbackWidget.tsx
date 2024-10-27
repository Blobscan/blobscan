import type { FC } from "react";
import React, { useEffect, useState } from "react";

import Chat from "~/icons/chat.svg";
import { Button } from "../Button";
import { FeedbackCard } from "./FeedbackCard";

async function getEnabled(): Promise<boolean> {
  const request = await fetch("/api/feedback/enabled");
  return (await request.json()).enabled;
}

export const FeedbackWidget: FC = () => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getEnabled().then(setEnabled);
  }, []);

  if (!enabled) {
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
