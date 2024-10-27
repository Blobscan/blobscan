import type { FC } from "react";

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
    <button
      type="button"
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
      {emoji}
    </button>
  );
};
