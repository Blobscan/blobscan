import type { FC, ReactNode } from "react";
import React from "react";
import cn from "classnames";

export type CardProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function (
  { children, header, compact = false, className },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        `
        flex 
        w-full
        flex-col 
        gap-5
        break-words
        rounded-lg
        border-surface-light
        bg-surface-light
        dark:border-surface-dark dark:bg-surface-dark
        ${className}
        `,
        {
          "p-3": compact,
          "p-6": !compact,
        }
      )}
    >
      {header && (
        <div className="text-lg font-semibold dark:text-warmGray-50">
          {header}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
});

Card.displayName = "Card";

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

export type CardFieldProps = { name: ReactNode; value: ReactNode };

export const CardField: FC<{ name: ReactNode; value: ReactNode }> = function ({
  name,
  value,
}) {
  return (
    <div className="flex gap-1 truncate text-xs">
      <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
        {name}
      </span>
      <div className="truncate">{value}</div>
    </div>
  );
};
