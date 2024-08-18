import type { FC, ReactNode } from "react";

type SurfaceCardBaseProps = {
  children: ReactNode;
  className?: string;
  truncateText?: boolean;
};

export const SurfaceCardBase: FC<SurfaceCardBaseProps> = function ({
  children,
  className,
  truncateText = true,
}) {
  return (
    <div
      className={`
    dark:bg-neutral-850
    ${truncateText ? "truncate" : ""}
    h-28
    rounded-md
    border
    border-border-light
    p-4
    dark:border-border-dark
    ${className}
    `}
    >
      {children}
    </div>
  );
};
