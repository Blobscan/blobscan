import type { FC, HTMLAttributes, ReactNode } from "react";
import React from "react";
import NextLink from "next/link";

import { env } from "~/env.mjs";
import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import type { BlobStorage, Size } from "~/types";
import { capitalize } from "~/utils";
import { Badge } from "./Badge";

type StorageConfig = {
  icon: ReactNode;
  style: HTMLAttributes<HTMLDivElement>["className"];
  buildDownloadUrl(blobReference: string): string;
};

const STORAGE_CONFIGS: Record<BlobStorage, StorageConfig> = {
  google: {
    icon: <GoogleIcon />,
    style:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-200",
    buildDownloadUrl(blobReference) {
      return `https://storage.googleapis.com/${env.NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME}/${blobReference}`;
    },
  },
  swarm: {
    icon: <SwarmIcon />,
    style:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 dark:hover:text-orange-200",
    buildDownloadUrl(blobReference) {
      return `https://gateway.ethswarm.org/access/${blobReference}`;
    },
  },
  postgres: {
    icon: <PostgresIcon />,
    style: "bg-blue-100 text-blue-800 dark:text-blue-300 hover:bg-blue-200",
    buildDownloadUrl(_) {
      return "#";
    },
  },
};

type StorageBadgeProps = {
  size?: Size;
  storage: BlobStorage;
  dataRef: string;
};

export const StorageBadge: FC<StorageBadgeProps> = ({
  size,
  storage,
  dataRef,
}) => {
  const { icon, style, buildDownloadUrl } = STORAGE_CONFIGS[storage];
  const downloadUrl = buildDownloadUrl(dataRef);

  return (
    <NextLink
      href={downloadUrl}
      target={downloadUrl !== "#" ? "_blank" : "_self"}
    >
      <Badge
        className={style}
        icon={icon}
        label={capitalize(storage)}
        size={size}
      />
    </NextLink>
  );
};
