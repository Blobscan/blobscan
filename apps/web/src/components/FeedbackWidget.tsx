import type { FC } from "react";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import Chat from "~/icons/chat.svg";
import Close from "~/icons/close.svg";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export const FeedbackWidget: React.FC = function () {
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
      <div className="z-100 fixed bottom-8 right-8">
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

interface FeedbackCardProps {
  open: boolean;
  onClose: () => void;
}

const FeedbackCard: FC<FeedbackCardProps> = ({ open, onClose }) => {
  const { pathname, query } = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [emoji, setEmoji] = useState("");

  async function sendFeedback() {
    const message = textAreaRef.current?.value;

    if (!message) {
      return;
    }

    await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        rate: emoji,
        metadata: {
          pathname,
          query,
        },
      }),
    });

    textAreaRef.current.value = "";
    setEmoji("");
    onClose();
  }

  return (
    <div className={`fixed bottom-20 right-8 ${open ? "block" : "hidden"}`}>
      <div
        className="
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
          "
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
          ref={textAreaRef}
          placeholder="Type your feedback here..."
        />
        <div className="mt-4 flex items-center justify-center gap-4 text-3xl">
          <Emoji
            active={emoji === "🙁"}
            onClick={() => {
              if (emoji === "🙁") {
                setEmoji("");
              } else {
                setEmoji("🙁");
              }
            }}
          >
            🙁
          </Emoji>
          <Emoji
            active={emoji === "😐"}
            onClick={() => {
              if (emoji === "😐") {
                setEmoji("");
              } else {
                setEmoji("😐");
              }
            }}
          >
            😐
          </Emoji>
          <Emoji
            active={emoji === "🙂"}
            onClick={() => {
              if (emoji === "🙂") {
                setEmoji("");
              } else {
                setEmoji("🙂");
              }
            }}
          >
            🙂
          </Emoji>
        </div>
        <Button className="mt-4 w-full" onClick={sendFeedback}>
          Submit
        </Button>
        <hr className="mt-4 border-border-light dark:border-border-dark" />
        <p className="mt-4">
          Please{" "}
          <Link
            href="https://github.com/Blobscan/blobscan/issues/new"
            className="text-link-light hover:underline dark:text-link-dark"
          >
            open a new issue
          </Link>{" "}
          if you have a feature request or want to report a bug
        </p>
      </div>
    </div>
  );
};

interface EmojiProps {
  children: string;
  active: boolean;
  onClick: () => void;
}

const Emoji: FC<EmojiProps> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "scale-110"
          : `
          cursor-pointer
          grayscale
          duration-200
          hover:scale-110
          `
      }
    >
      {children}
    </button>
  );
};
