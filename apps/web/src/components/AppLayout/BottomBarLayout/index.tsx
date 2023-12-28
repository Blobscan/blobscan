import type { ReactElement } from "react";
import React from "react";

import { Button } from "~/components/Button";
import { ExplorerDetails } from "~/components/ExplorerDetails";
import { Link } from "~/components/Link";
import DiscordIcon from "~/icons/discord.svg";
import GithubIcon from "~/icons/github.svg";
import XIcon from "~/icons/x.svg";

const EXTERNAL_APPS: { href: string; icon: ReactElement }[] = [
  {
    icon: <GithubIcon />,
    href: "https://github.com/Blobscan/blobscan",
  },
  {
    icon: <DiscordIcon />,
    href: "https://discord.gg/6KNZ2UVFRt",
  },
  {
    icon: <XIcon />,
    href: "https://twitter.com/blobscan",
  },
];

export const BottomBarLayout = () => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center space-y-4 p-2">
      <div className="sm:hidden">
        <ExplorerDetails />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {EXTERNAL_APPS.map(({ icon, href }) => (
            <Link key={href} href={href} isExternal hideExternalIcon>
              <Button variant="icon" icon={icon} size="md" />
            </Link>
          ))}
        </div>
        <div className="max-w-lg text-center text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
          Blobscan is the first open-source block explorer for the{" "}
          <Link href="https://www.eip4844.com/">EIP-4844</Link> shard blob
          transactions, providing the necessary infrastructure to scale
          Ethereum.
        </div>
        <div className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
          Made with ❤️ by{" "}
          <Link href="https://blossom.software/">Blossom Labs</Link>.
        </div>
        <div className="text-sm text-contentTertiary-light dark:text-contentTertiary-dark">
          Blobscan © 2023
        </div>
      </div>
    </div>
  );
};
