import type { FC, ReactNode } from "react";
import cn from "classnames";

import { Centered } from "../Centered";

export type CardProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  emptyState?: ReactNode;
};

export const Card: React.FC<CardProps> = function ({
  children,
  header,
  compact = false,
  className,
  emptyState,
}) {
  return (
    <div
      className={cn(
        `
        w-full 
        rounded-lg
        border 
        border-surface-light
        bg-surface-light  
        dark:border-surface-dark
        dark:bg-surface-dark
        ${className}
        `,
        {
          "p-3": compact,
          "p-6": !compact,
        }
      )}
    >
      {header && (
        <div className="text-lg font-bold dark:text-warmGray-50">{header}</div>
      )}
      <div className={header ? "mt-5" : ""}>
        {children ?? (
          <Centered>
            <div className="text-sm font-thin uppercase text-contentSecondary-light dark:text-contentSecondary-dark">
              {emptyState ?? "No Data"}
            </div>
          </Centered>
        )}
        {/* We use less vertical padding on card footers at all sizes than on headers or body sections */}
      </div>
    </div>
  );
};

export type CardHeaderProps = {
  children: ReactNode;
  inverse?: boolean;
  compact?: boolean;
};

export const CardHeader: FC<CardHeaderProps> = function ({
  children,
  inverse,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "bg-primary-300/30 text-base font-semibold dark:bg-surfaceHeader-dark",
        {
          "-mx-[13px] -mb-4 rounded-b-md": inverse,
          "-mx-4 -mt-4 rounded-t-md": !inverse,
          "p-3": !compact,
          "p-1": compact,
        }
      )}
    >
      {children}
    </div>
  );
};
