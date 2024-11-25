import type { FC } from "react";

import { IconButton } from "../IconButton";

interface EmojiProps {
  emoji: string;
  activated: boolean;
  onChange: (activated: boolean) => void;
}

export const Emoji: FC<EmojiProps> = ({ emoji, activated, onChange }) => {
  return (
    <IconButton
      type="button"
      onClick={() => onChange(!activated)}
      className={`text-2xl ${!activated && "grayscale"}`}
    >
      {emoji}
    </IconButton>
  );
};
