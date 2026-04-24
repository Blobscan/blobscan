import type { FC, FormEvent } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/compat/router";
import { animated, useSpring, useTransition } from "@react-spring/web";

import { useClickOutside } from "~/hooks/useClickOutside";
import Close from "~/icons/close.svg";
import { IconButton } from "../IconButton";
import { ErrorScreen } from "./Screens/ErrorScreen";
import { FormScreen } from "./Screens/FormScreen";
import { MenuScreen } from "./Screens/MenuScreen";
import { SuccessScreen } from "./Screens/SuccessScreen";

const SPRING_CONFIG = { tension: 420, friction: 30 };

type Screen = "menu" | "form" | "success" | "error";
type Direction = "forward" | "back";

type Feedback = {
  message: string;
  rate: string;
  metadata: { pathname: string; query: unknown };
};

async function sendFeedback(feedback: Feedback) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });
  if (!res.ok) throw new Error("Failed to send feedback");
}

interface FeedbackCardProps {
  open: boolean;
  onClose: () => void;
}

export const FeedbackModal: FC<FeedbackCardProps> = ({ open, onClose }) => {
  const [screen, setScreen] = useState<Screen>("menu");
  const dirRef = useRef<Direction>("forward");
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const transitions = useTransition(screen, {
    from: () => ({
      opacity: 0,
      x: dirRef.current === "forward" ? 24 : -24,
    }),
    enter: { opacity: 1, x: 0 },
    leave: () => ({
      opacity: 0,
      x: dirRef.current === "forward" ? -24 : 24,
    }),
    config: SPRING_CONFIG,
  });

  const [heightSpring, heightApi] = useSpring(() => ({ height: 0 }));

  const navigate = useCallback((to: Screen, dir: Direction = "forward") => {
    dirRef.current = dir;
    setScreen(to);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedEmoji(undefined);
    setMessage("");
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    heightApi.stop();
    setScreen("menu");
    resetForm();
    onClose();
  }, [heightApi, resetForm, onClose]);

  useClickOutside(cardRef, () => {
    handleClose();
  });

  // Snap to current screen height when the card opens (no animation).
  useEffect(() => {
    if (!open || !contentRef.current) return;
    heightApi.set({ height: contentRef.current.offsetHeight });
  }, [open, heightApi]);

  // Animate height when transitioning between screens.
  useEffect(() => {
    if (!open || !contentRef.current) return;
    heightApi.start({
      height: contentRef.current.offsetHeight,
      config: SPRING_CONFIG,
    });
  }, [open, screen, heightApi]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  // useEffect(() => {
  //   if (!open) return;
  //   function handleClickOutside(e: MouseEvent) {
  //     if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
  //       handleClose();
  //     }
  //   }
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [open, handleClose]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!router || submitting) return;
    if (!selectedEmoji) return;
    setSubmitting(true);
    try {
      await sendFeedback({
        message,
        rate: selectedEmoji,
        metadata: { pathname: router.pathname, query: router.query },
      });
      navigate("success", "forward");
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      navigate("error", "forward");
    }
  }

  return (
    <div
      ref={cardRef}
      className={`
        fixed bottom-20 right-8
        w-80 overflow-hidden
        rounded-md border border-border-light
        bg-surface-light p-6
        text-content-light
        shadow-xl
        dark:border-border-dark
        dark:bg-surface-dark
        dark:text-content-dark
        ${open ? "block" : "hidden"}
      `}
    >
      <IconButton
        className="absolute right-3 top-3"
        onClick={handleClose}
        aria-label="Close feedback"
      >
        <Close />
      </IconButton>

      <animated.div
        style={{
          height: heightSpring.height,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {transitions((style, item) => (
          <animated.div
            style={{
              ...style,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {/* contentRef always tracks the active (entering) screen for height measurement */}
            <div ref={item === screen ? contentRef : undefined}>
              {item === "menu" && (
                <MenuScreen
                  onFeedbackClick={() => navigate("form", "forward")}
                />
              )}
              {item === "form" && (
                <FormScreen
                  message={message}
                  selectedEmoji={selectedEmoji}
                  submitting={submitting}
                  onMessageChange={setMessage}
                  onEmojiChange={setSelectedEmoji}
                  onBack={() => {
                    resetForm();
                    navigate("menu", "back");
                  }}
                  onSubmit={onSubmit}
                />
              )}
              {item === "success" && <SuccessScreen onClose={handleClose} />}
              {item === "error" && (
                <ErrorScreen
                  onRetry={() => {
                    resetForm();
                    navigate("menu", "back");
                  }}
                />
              )}
            </div>
          </animated.div>
        ))}
      </animated.div>
    </div>
  );
};
