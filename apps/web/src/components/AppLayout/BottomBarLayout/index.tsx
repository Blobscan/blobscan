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
    icon: <GithubIcon className="h-5 w-5" />,
    href: "https://github.com/DillLabs/blobscan",
  },
  {
    icon: <DiscordIcon className="h-5 w-5" />,
    href: "https://discord.gg/UPSFTbcmtv",
  },
  {
    icon: <XIcon className="h-5 w-5" />,
    href: "https://twitter.com/dill_xyz_",
  },
];

export const BottomBarLayout = () => {
  return (
    <div className=" flex flex-col items-center justify-center p-2">
      <div className="sm:hidden">
        <ExplorerDetails />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 sm:mt-8">
        <div className="flex items-center gap-2">
          {EXTERNAL_APPS.map(({ icon, href }) => (
            <Link key={href} href={href} isExternal hideExternalIcon>
              <Button variant="icon" icon={icon} size="md" />
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="text-sm text-contentTertiary-light dark:text-contentTertiary-dark">
            Dillscan © 2024
          </div>
        </div>
      </div>
    </div>
  );
};
