import { type FC, type ReactNode } from "react";

type SurfaceCardBaseProps = {
  children: ReactNode;
  className?: string;
};

export const SurfaceCardBase: FC<SurfaceCardBaseProps> = function ({
  children,
  className,
}) {
  return (
    <div
      className={`
    dark:bg-neutral-850
    truncate
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
