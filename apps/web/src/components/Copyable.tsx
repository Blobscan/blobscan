import type { FC } from "react";
import React from "react";

import { CopyToClipboard } from "./CopyToClipboard";
import { Link } from "./Link";

export interface CopyableProps {
  href?: string;
  value: string;
  tooltipText?: string;
  children?: React.ReactNode;
}

export const Copyable: FC<CopyableProps> = ({
  href,
  value,
  tooltipText,
  children,
}) => {
  return (
    <div className="flex items-center gap-1" title={value}>
      {href ? (
        <Link href={href}>{children || value}</Link>
      ) : (
        <div className="truncate">{children || value}</div>
      )}
      <CopyToClipboard value={value} tooltipText={tooltipText} />
    </div>
  );
};
