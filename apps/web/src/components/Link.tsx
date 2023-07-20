import React from "react";
import type { ReactNode } from "react";
import NextLink from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

type LinkProps = {
  children: string | ReactNode;
  href: string;
  isExternal?: boolean;
};

export const Link: React.FC<LinkProps> = function ({
  children,
  href,
  isExternal = false,
}) {
  return (
    <NextLink
      href={href}
      target={isExternal ? "_blank" : "_self"}
      className="relative z-0 inline-flex max-w-full items-center text-link-light hover:underline dark:text-link-dark"
    >
      <div className="flex w-full items-center">
        <span className="truncate">{children}</span>
        {isExternal && (
          <ArrowTopRightOnSquareIcon
            className="relative bottom-[2px] ml-1 h-5 w-5"
            aria-hidden="true"
          />
        )}
      </div>
    </NextLink>
  );
};
