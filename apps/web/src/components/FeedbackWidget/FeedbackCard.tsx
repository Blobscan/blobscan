import type { FC, FormEvent } from "react";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import Close from "~/icons/close.svg";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Emoji } from "./Emoji";

const OPEN_ISSUE_LINK = "https://github.com/Blobscan/blobscan/issues/new";

type Feedback = {
  message: string;
  rate: string;
  metadata: {
    pathname: string;
    query: unknown;
  };
};

async function sendFeedback(feedback: Feedback) {
  await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedback),
  });
}

interface FeedbackCardProps {
  open: boolean;
  onClose: () => void;
}

export const FeedbackCard: FC<FeedbackCardProps> = ({ open, onClose }) => {
  const [emoji, setEmoji] = useState("");
  const { pathname, query } = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = formData.get("feedback");

    if (typeof message !== "string") {
      return;
    }

    await sendFeedback({
      message,
      rate: emoji,
      metadata: {
        pathname,
        query,
      },
    });

    form.reset();
    setEmoji("");
    onClose();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`
        fixed 
        bottom-20 
        right-8
        max-w-[400px]
        rounded-md  
        border
        border-border-light
        bg-surface-light
        p-8
        text-contentSecondary-light
        shadow-xl
        dark:border-border-dark
        dark:bg-surface-dark
        dark:text-contentSecondary-dark
        ${open ? "block" : "hidden"}`}
    >
      <IconButton className="absolute right-3 top-3" onClick={onClose}>
        <Close />
      </IconButton>
      <p className="text-xl">Hi 👋</p>
      <p>Have feedback? We&#39;d love to hear it.</p>
      <textarea
        className="
          mt-4
          h-28
          w-full
          resize-none
          rounded-md
          border
          border-border-light
          bg-transparent
          p-2
          placeholder-current
          dark:border-border-dark
          "
        name="feedback"
        placeholder="Type your feedback here..."
      />
      <div className="mt-4 flex items-center justify-center gap-4 text-3xl">
        <Emoji emoji="🙁" currentEmoji={emoji} setEmoji={setEmoji} />
        <Emoji emoji="😐" currentEmoji={emoji} setEmoji={setEmoji} />
        <Emoji emoji="🙂" currentEmoji={emoji} setEmoji={setEmoji} />
      </div>
      <Button className="mt-4 w-full" type="submit">
        Submit
      </Button>
      <hr className="mt-4 border-border-light dark:border-border-dark" />
      <p className="mt-4">
        Please{" "}
        <Link
          href={OPEN_ISSUE_LINK}
          className="text-link-light hover:underline dark:text-link-dark"
        >
          open a new issue
        </Link>{" "}
        if you have a feature request or want to report a bug
      </p>
    </form>
  );
};
