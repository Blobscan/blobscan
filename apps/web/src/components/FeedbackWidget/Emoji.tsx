import type { FC } from "react";

import { IconButton } from "../IconButton";

interface EmojiProps {
  emoji: string;
  label: string;
  activated: boolean;
  onChange: (activated: boolean) => void;
}

export const Emoji: FC<EmojiProps> = ({ emoji, label, activated, onChange }) => {
  return (
    <IconButton
      type="button"
      onClick={() => onChange(!activated)}
      className={`text-2xl ${!activated && "grayscale"}`}
      aria-label={label}
      aria-pressed={activated}
    >
      {emoji}
    </IconButton>
  );
};
