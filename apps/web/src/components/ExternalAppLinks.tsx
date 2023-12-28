import type { FC, ReactElement } from "react";

import DiscordIcon from "~/icons/discord.svg";
import GithubIcon from "~/icons/github.svg";
import XIcon from "~/icons/x.svg";
import type { Size } from "~/types";
import { Button } from "./Button";
import { Link } from "./Link";

const EXTERNAL_APPS: { href: string; icon: ReactElement; size?: Size }[] = [
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

export const ExternalAppLinks: FC = function () {
  return (
    <div className="flex items-center gap-2">
      {EXTERNAL_APPS.map(({ icon, href }) => (
        <Link key={href} href={href} isExternal hideExternalIcon>
          <Button variant="icon" icon={icon} size="sm" />
        </Link>
      ))}
    </div>
  );
};
