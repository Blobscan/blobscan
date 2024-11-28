import type { FC, ReactNode } from "react";
import React from "react";

import { CopyToClipboard } from "./CopyToClipboard";

export interface CopyableProps {
  value: string;
  tooltipText?: string;
  children?: ReactNode;
}

export const Copyable: FC<CopyableProps> = ({
  value,
  tooltipText,
  children,
}) => {
  return (
    <div className="flex items-center gap-1" title={value}>
      <div className="truncate">{children || value}</div>
      <CopyToClipboard value={value} tooltipText={tooltipText} />
    </div>
  );
};
