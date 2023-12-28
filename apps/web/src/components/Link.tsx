import React from "react";
import type { ReactNode } from "react";
import NextLink from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

type LinkProps = {
  children: string | ReactNode;
  href: string;
  hideExternalIcon?: boolean;
  isExternal?: boolean;
};

export const Link: React.FC<LinkProps> = function ({
  children,
  href,
  isExternal = false,
  hideExternalIcon = false,
}) {
  return (
    <span className="truncate">
      <NextLink
        href={href}
        target={isExternal ? "_blank" : "_self"}
        className="relative z-0 inline-flex max-w-full items-center text-link-light hover:underline dark:text-link-dark"
      >
        <div className="flex w-full items-center">
          <span className="truncate">{children}</span>
          {Boolean(isExternal && !hideExternalIcon) && (
            <ArrowTopRightOnSquareIcon
              className="relative bottom-[2px] ml-1 h-4 w-4"
              aria-hidden="true"
            />
          )}
        </div>
      </NextLink>
    </span>
  );
};
