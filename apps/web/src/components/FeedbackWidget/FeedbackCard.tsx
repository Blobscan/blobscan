import type { FC, FormEvent } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/compat/router";
import Link from "next/link";

import Close from "~/icons/close.svg";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Emoji } from "./Emoji";

const OPEN_ISSUE_LINK = "https://github.com/Blobscan/blobscan/issues/new";
const RATE_EMOJIS: { emoji: string; label: string }[] = [
  { emoji: "🙁", label: "Bad" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
];
const SUCCESS_DISPLAY_MS = 1500;

type Feedback = {
  message: string;
  rate: string;
  metadata: {
    pathname: string;
    query: unknown;
  };
};

async function sendFeedback(feedback: Feedback) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedback),
  });

  if (!res.ok) {
    throw new Error("Failed to send feedback");
  }
}

interface FeedbackCardProps {
  open: boolean;
  onClose: () => void;
}

export const FeedbackCard: FC<FeedbackCardProps> = ({ open, onClose }) => {
  const [emoji, setEmoji] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const resetForm = useCallback(() => {
    setEmoji(undefined);
    setMessage("");
    setError(undefined);
    setSubmitting(false);
    setSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClose]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!router || submitting) {
      return;
    }

    if (!emoji) {
      setError("Please select a reaction");
      return;
    }

    setError(undefined);
    setSubmitting(true);

    try {
      await sendFeedback({
        message,
        rate: emoji,
        metadata: {
          pathname: router.pathname,
          query: router.query,
        },
      });

      setSubmitted(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, SUCCESS_DISPLAY_MS);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
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
      <IconButton
        className="absolute right-3 top-3"
        onClick={handleClose}
        aria-label="Close feedback"
      >
        <Close />
      </IconButton>
      {submitted ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <p className="text-2xl">🎉</p>
          <p className="text-lg font-semibold">Thank you for your feedback!</p>
        </div>
      ) : (
        <>
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
            ref={textareaRef}
            name="feedback"
            aria-label="Feedback message"
            placeholder="Type your feedback here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
          />
          <div
            className="mt-4 flex items-center justify-center gap-4 text-3xl"
            role="group"
            aria-label="Rate your experience"
          >
            {RATE_EMOJIS.map(({ emoji: e, label }) => (
              <Emoji
                key={e}
                emoji={e}
                label={label}
                activated={emoji === e}
                onChange={(activated) => {
                  setEmoji(activated ? e : undefined);
                  setError(undefined);
                }}
              />
            ))}
          </div>
          {error && (
            <p className="mt-2 text-center text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Submit"}
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
        </>
      )}
    </form>
  );
};
