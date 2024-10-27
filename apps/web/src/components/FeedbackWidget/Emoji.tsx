import type { FC } from "react";

import { IconButton } from "../IconButton";

interface EmojiProps {
  emoji: string;
  currentEmoji: string;
  onChange: (emoji: string) => void;
}

export const Emoji: FC<EmojiProps> = ({ emoji, currentEmoji, onChange }) => {
  const active = emoji === currentEmoji;

  function onClick() {
    if (active) {
      onChange("");
    } else {
      onChange(emoji);
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
