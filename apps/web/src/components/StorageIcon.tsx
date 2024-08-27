import NextLink from "next/link";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import cn from "classnames";

import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import type { BlobStorage, Size } from "~/types";
import { capitalize } from "~/utils";

export type StorageIconProps = {
  storage: BlobStorage;
  size?: Size;
  url?: string;
};

export const StorageIcon: React.FC<StorageIconProps> = ({
  size = "md",
  storage,
  url = "#",
}) => {
  const commonStyles = cn({
    "h-3 w-3": size === "sm",
    "h-4 w-4": size === "md",
    "h-5 w-5": size === "lg",
  });

  let storageIcon;

  switch (storage) {
    case "FILE_SYSTEM":
      storageIcon = <ArchiveBoxIcon className={commonStyles} />;
      break;
    case "GOOGLE":
      storageIcon = <GoogleIcon className={commonStyles} />;
      break;
    case "SWARM":
      storageIcon = <SwarmIcon className={commonStyles} />;
      break;
    case "POSTGRES":
      storageIcon = <PostgresIcon className={commonStyles} />;
      break;
  }

  return (
    <NextLink href={url} target={url !== "#" ? "_blank" : "_self"}>
      <div
        title={capitalize(storage)}
        className={url ? `hover:opacity-70` : ""}
      >
        {storageIcon}
      </div>
    </NextLink>
  );
};
