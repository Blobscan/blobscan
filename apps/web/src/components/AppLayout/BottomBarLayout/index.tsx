import type { ReactElement } from "react";
import React from "react";

import { ExplorerDetails } from "~/components/ExplorerDetails";
import { IconButton } from "~/components/IconButton";
import { Link } from "~/components/Link";
import { env } from "~/env.mjs";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import DiscordIcon from "~/icons/discord.svg";
import GithubIcon from "~/icons/github.svg";
import XIcon from "~/icons/x.svg";

const EXTERNAL_APPS: { href: string; icon: ReactElement }[] = [
  {
    icon: <GithubIcon className="h-5 w-5" />,
    href: "https://github.com/Blobscan/blobscan",
  },
  {
    icon: <DiscordIcon className="h-5 w-5" />,
    href: "https://discord.gg/6KNZ2UVFRt",
  },
  {
    icon: <XIcon className="h-5 w-5" />,
    href: "https://twitter.com/blobscan",
  },
];

export const BottomBarLayout = () => {
  const breakpoint = useBreakpoint();
  const isSmallScreen = breakpoint === "default";

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="mt-4 flex flex-col items-center gap-2 sm:mt-8">
        <div className="mb-2">
          <ExplorerDetails placement="footer" isSmallScreen={isSmallScreen} />
        </div>
        <div className="flex items-center gap-2">
          {EXTERNAL_APPS.map(({ icon, href }) => (
            <Link key={href} href={href} isExternal hideExternalIcon>
              <IconButton>{icon}</IconButton>
            </Link>
          ))}
        </div>
        <div className="max-w-lg text-center text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
          Blobscan is the first open-source block explorer for the{" "}
          <Link href="https://www.eip4844.com/" isExternal>
            EIP-4844
          </Link>{" "}
          shard blob transactions, providing the necessary infrastructure to
          scale Ethereum.
        </div>
        {env.NEXT_PUBLIC_VERSION && (
          <div className="flex items-center gap-1">
            <div className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
              Version:
            </div>
            <div className="relative">
              <Link
                href={`https://github.com/Blobscan/blobscan/tree/%40blobscan/web%40${env.NEXT_PUBLIC_VERSION}`}
                isExternal
              >
                <div className="relative -top-0.5 text-xs">
                  {env.NEXT_PUBLIC_VERSION}
                </div>
              </Link>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <div className="text-sm text-contentTertiary-light dark:text-contentTertiary-dark">
            Blobscan © 2024
          </div>
        </div>
      </div>
    </div>
  );
};
