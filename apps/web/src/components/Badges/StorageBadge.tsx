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
  google: {
    style:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-200",
  },
  swarm: {
    style:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 dark:hover:text-orange-200",
  },
  swarmycloud: {
    name: "Swarm",
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
  s3: {
    name: "S3",
    style:
      "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 hover:text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 dark:hover:text-yellow-200",
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
