import type { ReactElement } from "react";
import React from "react";

import DiscordIcon from "~/icons/discord.svg";
import GithubIcon from "~/icons/github.svg";
import XIcon from "~/icons/x.svg";
import { IconButton } from "./IconButton";
import { Link } from "./Link";

const EXTERNAL_LINKS: { href: string; icon: ReactElement }[] = [
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

export const BlobscanSocialLinks: React.FC = function () {
  return (
    <div className="flex items-center gap-2">
      {EXTERNAL_LINKS.map(({ icon, href }) => (
        <Link key={href} href={href} isExternal hideExternalIcon>
          <IconButton>{icon}</IconButton>
        </Link>
      ))}
    </div>
  );
};
