import type { FC, HTMLAttributes } from "react";
import React from "react";
import NextLink from "next/link";

import type { BlobStorage } from "~/types";
import { capitalize } from "~/utils";
import { StorageIcon } from "../StorageIcon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

type StorageConfig = {
  name?: string;
  style: HTMLAttributes<HTMLDivElement>["className"];
};

const STORAGE_CONFIGS: Record<BlobStorage, StorageConfig> = {
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
    style:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200",
  },
};

type StorageBadgeProps = BadgeProps & {
  storage: BlobStorage;
  url: string;
};

export const StorageBadge: FC<StorageBadgeProps> = ({
  storage,
  url,
  ...props
}) => {
  const { name, style } = STORAGE_CONFIGS[storage];

  return (
    <NextLink href={url} target={url !== "#" ? "_blank" : "_self"}>
      <Badge className={style} {...props}>
        <StorageIcon storage={storage} />
        {name ?? capitalize(storage)}
      </Badge>
    </NextLink>
  );
};
