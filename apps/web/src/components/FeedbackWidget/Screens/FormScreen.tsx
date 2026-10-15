import { useEffect, useRef } from "react";
import type { FC, FormEvent } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import cn from "classnames";

import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { IconButton } from "~/components/IconButton";
import { Spinner } from "~/components/Spinner";

const RATE_EMOJIS: { emoji: string; label: string }[] = [
  { emoji: "🙁", label: "Bad" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
];

export interface FormScreenProps {
  message: string;
  selectedEmoji: string | undefined;
  submitting: boolean;
  onMessageChange: (v: string) => void;
  onEmojiChange: (emoji: string | undefined) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface EmojiProps {
  emoji: string;
  label: string;
  activated: boolean;
  onChange: (activated: boolean) => void;
}

export const Emoji: FC<EmojiProps> = ({
  emoji,
  label,
  activated,
  onChange,
}) => {
  return (
    <IconButton
      type="button"
      onClick={() => onChange(!activated)}
      aria-label={label}
      aria-pressed={activated}
    >
      <span
        className={cn("text-2xl", {
          "opacity-30 hover:dark:opacity-60": !activated,
        })}
      >
        {emoji}
      </span>
    </IconButton>
  );
};

export function FormScreen({
  message,
  selectedEmoji,
  submitting,
  onMessageChange,
  onEmojiChange,
  onBack,
  onSubmit,
}: FormScreenProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pt-1">
      <p className="text-base">Share Feedback</p>
      <textarea
        ref={textareaRef}
        className="h-24 w-full resize-none rounded-md border border-border-light bg-transparent p-2 text-sm placeholder-current focus:border-controlBorderActive-light dark:border-border-dark dark:placeholder:text-content-dark/20 dark:focus:border-controlBorderActive-dark"
        name="feedback"
        aria-label="Feedback message"
        placeholder="Describe your experience..."
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        disabled={submitting}
      />
      <div
        className="flex items-center justify-center gap-4 text-3xl"
        role="group"
        aria-label="Rate your experience"
      >
        {RATE_EMOJIS.map(({ emoji, label }) => (
          <Emoji
            key={emoji}
            emoji={emoji}
            label={label}
            activated={selectedEmoji === emoji}
            onChange={(activated) =>
              onEmojiChange(activated ? emoji : undefined)
            }
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          <div className="flex items-center gap-1">
            <Icon src={ChevronLeftIcon} size="sm" />
          </div>
        </Button>
        <Button
          type="submit"
          disabled={submitting || !selectedEmoji}
          className="flex flex-1 items-center justify-center"
        >
          {submitting ? (
            <>
              <Spinner size="sm" />
              Submitting…
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </form>
  );
}
