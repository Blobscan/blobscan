import { type HTMLAttributes } from "react";

type SkeletonProps = {
  className?: HTMLAttributes<HTMLDivElement>["className"];
};

export const SkeletonRow: React.FC<SkeletonProps> = function ({ className }) {
  return (
    <div
      className={`rounded bg-skeleton-light dark:bg-skeleton-dark ${className}`}
    />
  );
};
