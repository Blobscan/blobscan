import NextLink from "next/link";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import cn from "classnames";

import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import type { BlobStorage, Size } from "~/types";
import { buildStorageDownloadUrl, capitalize } from "~/utils";

export type StorageIconProps = {
  storage: BlobStorage;
  size?: Size;
  blobReference?: string;
};

export const StorageIcon: React.FC<StorageIconProps> = ({
  size = "md",
  storage,
  blobReference,
}) => {
  const commonStyles = cn({
    "h-3 w-3": size === "sm",
    "h-4 w-4": size === "md",
    "h-5 w-5": size === "lg",
  });
  const downloadUrl = blobReference
    ? buildStorageDownloadUrl(storage, blobReference) ?? "#"
    : "#";
  let storageIcon;

  switch (storage) {
    case "file_system":
      storageIcon = <ArchiveBoxIcon className={commonStyles} />;
      break;
    case "google":
      storageIcon = <GoogleIcon className={commonStyles} />;
      break;
    case "swarm":
      storageIcon = <SwarmIcon className={commonStyles} />;
      break;
    case "postgres":
      storageIcon = <PostgresIcon className={commonStyles} />;
      break;
  }

  return (
    <NextLink
      href={downloadUrl}
      target={downloadUrl !== "#" ? "_blank" : "_self"}
    >
      <div
        title={capitalize(storage)}
        className={downloadUrl ? `hover:opacity-70` : ""}
      >
        {storageIcon}
      </div>
    </NextLink>
  );
};
