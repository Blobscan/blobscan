import type { FC } from "react";
import React from "react";
import NextLink from "next/link";

import { ICONS } from "~/icons/blob-storages";
import type { BlobStorage } from "~/types";
import { capitalize } from "~/utils";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

type StorageBadgeProps = BadgeProps & {
  compact?: boolean;
  storage: BlobStorage;
  url: string;
};

type StorageConfig = {
  name?: string;
  style: string;
};

export const STORAGES: Record<BlobStorage, StorageConfig> = {
  file_system: {
    name: "File System",
    style:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200",
  },
  google: {
    style:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-200",
  },
  swarm: {
    style:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 dark:hover:text-orange-200",
  },
  postgres: {
    style:
      "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800",
  },
  weavevm: {
    name: "Load Network",
    style:
      "bg-blue-300 text-gray-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-blue-200",
  },
  chunkstorm: {
    name: "Chunkstorm",
    style:
      "bg-purple-300 text-purple-800 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-800 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-purple-200",
  },
};

export const StorageBadge: FC<StorageBadgeProps> = ({
  compact = false,
  storage,
  url,
  ...props
}) => {
  const { name = capitalize(storage), style } = STORAGES[storage];
  const storageIcon = (
    <Icon
      src={ICONS[storage]}
      size={props.size ?? "md"}
      title={compact ? name : undefined}
      className={compact ? `hover:opacity-70` : ""}
    />
  );

  return (
    <NextLink href={url} target={url !== "#" ? "_blank" : "_self"}>
      {compact ? (
        storageIcon
      ) : (
        <Badge className={style} {...props}>
          {storageIcon}
          {name}
        </Badge>
      )}
    </NextLink>
  );
};
