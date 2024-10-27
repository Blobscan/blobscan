import type { FC } from "react";

import { IconButton } from "../IconButton";

interface EmojiProps {
  emoji: string;
  currentEmoji: string;
  setEmoji: (emoji: string) => void;
}

export const Emoji: FC<EmojiProps> = ({ emoji, currentEmoji, setEmoji }) => {
  const active = emoji === currentEmoji;

  function onClick() {
    if (active) {
      setEmoji("");
    } else {
      setEmoji(emoji);
    }
  }

  return (
    <IconButton
      type="button"
      onClick={onClick}
      className={`text-2xl ${!active && "grayscale"}`}
    >
      {emoji}
    </IconButton>
  );
};
