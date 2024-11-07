import type { FC, ReactNode } from "react";

import { CopyToClipboard } from "./CopyToClipboard";
import { Link } from "./Link";

export type CopyableLinkProps = {
  href: string;
  value: string;
  children: ReactNode;
  tooltipText?: string;
};

export const CopyableLink: FC<CopyableLinkProps> = function ({
  href,
  value,
  children,
  tooltipText,
}) {
  return (
    <div className="flex items-center gap-1">
      <Link href={href}>{children}</Link>
      <CopyToClipboard value={value} label={tooltipText} />
    </div>
  );
};
