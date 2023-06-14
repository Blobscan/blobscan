import { type FC, type ReactNode } from "react";

type SurfaceCardBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export const CardBase: FC<SurfaceCardBaseProps> = function ({
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

type CardTitleBaseProps = {
  children: ReactNode;
  type?: "header" | "footer";
};

export const CardTitleBase: FC<CardTitleBaseProps> = function ({
  children,
  type = "header",
}) {
  return (
    <div
      className={`
        -mx-4
        ${type === "header" ? "-mt-4" : "-mb-4"}
        bg-surfaceHeader-light
        p-3
        text-base
        font-semibold
        dark:bg-primary-900
      `}
    >
      {children}
    </div>
  );
};
