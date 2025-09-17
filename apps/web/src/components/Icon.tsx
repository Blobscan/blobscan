import type { FC } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

import type { Size } from "~/types";
import type { RenderableIcon } from "~/types/icons";

export type IconProps = {
  className?: string;
  src: RenderableIcon;
  title?: string;
  size?: Size;
};

const ICON_CLASSES: Record<
  Size,
  {
    className: string;
    css: {
      width: number;
      height: number;
    };
  }
> = {
  xs: {
    className: "h-2 w-2",
    css: {
      width: 8,
      height: 8,
    },
  },
  sm: {
    className: "h-3 w-3",
    css: {
      width: 12,
      height: 12,
    },
  },
  md: {
    className: "h-4 w-4",
    css: {
      width: 16,
      height: 16,
    },
  },
  lg: {
    className: "h-5 w-5",
    css: {
      width: 20,
      height: 20,
    },
  },
  xl: {
    className: "h-6 w-6",
    css: {
      width: 24,
      height: 24,
    },
  },
  "2xl": {
    className: "h-8 w-8",
    css: {
      width: 28,
      height: 28,
    },
  },
};

export const Icon: FC<IconProps> = function ({
  className: classNameProp,
  src: IconOrSrc,
  title,
  size = "md",
}) {
  const {
    className,
    css: { width, height },
  } = ICON_CLASSES[size];
  return typeof IconOrSrc === "string" ? (
    <Image
      alt={title ?? ""}
      width={width}
      height={height}
      src={IconOrSrc}
      className={className}
    />
  ) : (
    <div title={title}>
      <IconOrSrc className={twMerge(className, classNameProp)} />
    </div>
  );
};
