import type { FC } from "react";
import React from "react";
import dynamic from "next/dynamic";
import NextLink from "next/link";

import { STORAGE_DEFINITIONS } from "~/defintions/blob-storages";
import type { BlobStorage } from "~/types";
import { capitalize } from "~/utils";
import { Icon } from "../Icon";
import type { BadgeProps } from "./Badge";
import { BrandBadge } from "./BrandBadge";

type StorageBadgeProps = BadgeProps & {
  compact?: boolean;
  storage: BlobStorage;
  url?: string;
};

export const StorageBadge: FC<StorageBadgeProps> = ({
  compact = false,
  storage,
  url = "#",
  ...props
}) => {
  const {
    name = capitalize(storage),
    color,
    iconSrc = `${storage}.svg`,
  } = STORAGE_DEFINITIONS[storage];

  const storageIcon = (
    <Icon
      src={dynamic(() => import(`~/icons/blob-storages/${iconSrc}`))}
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
        <BrandBadge
          brandColor={color}
          className="hover:brightness-95 dark:hover:brightness-110"
          {...props}
        >
          {storageIcon}
          {name}
        </BrandBadge>
      )}
    </NextLink>
  );
};
