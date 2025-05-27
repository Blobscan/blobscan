import NextLink from "next/link";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import cn from "classnames";

import GoogleIcon from "~/icons/blob-storages/google.svg";
import PostgresIcon from "~/icons/blob-storages/postgres.svg";
import SwarmIcon from "~/icons/blob-storages/swarm.svg";
import WeaveVMIcon from "~/icons/blob-storages/weavevm.svg";
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
  const storageName =
    storage === "weavevm" ? "Load Network" : capitalize(storage);

  let StorageIcon;

  switch (storage) {
    case "file_system":
      StorageIcon = ArchiveBoxIcon;
      break;
    case "google":
      StorageIcon = GoogleIcon;
      break;
    case "swarm":
      StorageIcon = SwarmIcon;
      break;
    case "postgres":
      StorageIcon = PostgresIcon;
      break;
    case "weavevm":
      StorageIcon = WeaveVMIcon;
      break;
  }

  return (
    <NextLink href={url} target={url !== "#" ? "_blank" : "_self"}>
      <div title={storageName} className={url ? `hover:opacity-70` : ""}>
        <StorageIcon className={commonStyles} />
      </div>
    </NextLink>
  );
};
