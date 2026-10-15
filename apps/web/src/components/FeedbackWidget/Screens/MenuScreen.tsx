import type { ReactNode } from "react";

const BUGS_LINK = "https://github.com/Blobscan/blobscan/issues/new?labels=bug";
const FEATURE_LINK =
  "https://github.com/Blobscan/blobscan/issues/new?labels=enhancement";

function MenuItemBase({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-iconHighlight-light dark:hover:bg-iconHighlight-dark">
      {children}
    </div>
  );
}

function MenuLinkItem({
  href,
  label,
  emoji,
}: {
  href: string;
  label: ReactNode;
  emoji: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <MenuItemBase>
        <span className="text-xl">{emoji}</span>
        {label}
        <span className="ml-auto text-xs opacity-40">↗</span>
      </MenuItemBase>
    </a>
  );
}

function MenuItem({
  label,
  emoji,
  onClick,
}: {
  label: ReactNode;
  emoji: string;
  onClick(): void;
}) {
  return (
    <button type="button" onClick={onClick}>
      <MenuItemBase>
        <span className="text-xl">{emoji}</span>
        <span>{label}</span>
        <span className="ml-auto text-xs opacity-40">→</span>
      </MenuItemBase>
    </button>
  );
}

export function MenuScreen({
  onFeedbackClick,
}: {
  onFeedbackClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 pt-1">
      <p className="mb-3 text-base">Hi 👋 How can we help?</p>
      <MenuLinkItem href={BUGS_LINK} label="Report a Bug" emoji="🐛" />
      <MenuLinkItem href={FEATURE_LINK} label="Request a Feature" emoji="💡" />
      <MenuItem
        emoji="🤔"
        label="Share your Feedback"
        onClick={onFeedbackClick}
      />
    </div>
  );
}
