import { type FC, type HTMLAttributes, type ReactNode } from "react";

type SkeletonProps = {
  className?: HTMLAttributes<HTMLDivElement>["className"];
};

export const SkeletonRow: FC<SkeletonProps> = function ({ className }) {
  return (
    <div
      className={`rounded bg-skeleton-light dark:bg-skeleton-dark ${className}`}
    />
  );
};

export const SkeletonBase: FC<{ children: ReactNode }> = function ({
  children,
}) {
  return <div className="animate-pulse">{children}</div>;
};
