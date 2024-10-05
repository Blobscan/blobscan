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
    <NextLink
      href={href}
      target={isExternal ? "_blank" : "_self"}
      className="inline-flex max-w-full items-center truncate text-link-light hover:underline dark:text-link-dark"
    >
      <div className="truncate">{children}</div>
      {Boolean(isExternal && !hideExternalIcon) && (
        <ArrowTopRightOnSquareIcon
          className="relative bottom-[2.5px] ml-1 h-3 w-3"
          aria-hidden="true"
        />
      )}
    </NextLink>
  );
};
