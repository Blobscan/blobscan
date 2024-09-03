import type { FC } from "react";

import type { Size } from "~/types";
import "react-loading-skeleton/dist/skeleton.css";
import ReactLoadingSkeleton from "react-loading-skeleton";
import type { SkeletonProps as ReactLoadingSkeletonProps } from "react-loading-skeleton";

export type SkeletonProps = ReactLoadingSkeletonProps & {
  size?: Size;
  width?: number | string;
  height?: number | string;
};
export const Skeleton: FC<SkeletonProps> = function ({
  size = "md",
  height,
  ...props
}) {
  const height_ = height ?? (size === "xs" ? 12 : size === "sm" ? 14 : 18);

  return (
    <ReactLoadingSkeleton
      height={height_}
      {...props}
      style={{ lineHeight: "unset" }}
    />
  );
};
