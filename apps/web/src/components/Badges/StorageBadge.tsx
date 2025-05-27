import type { FC } from "react";
import React from "react";
import NextLink from "next/link";

import { STORAGE_CONFIGS } from "~/blob-storages";
import type { BlobStorage } from "~/types";
import { capitalize } from "~/utils";
import { StorageIcon } from "../StorageIcon";
import type { BadgeProps } from "./Badge";
import { Badge } from "./Badge";

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
