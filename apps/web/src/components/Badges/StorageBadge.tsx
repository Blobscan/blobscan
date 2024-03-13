import type { FC, ReactNode } from "react";
import React from "react";
import NextLink from "next/link";

import type { BlobStorage } from "@blobscan/api";

import { env } from "~/env.mjs";
import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import type { Size } from "~/types";
import { capitalize } from "~/utils";
import { Badge } from "./Badge";

const buildBlobDataRef = (storage: BlobStorage, dataRef: string) => {
  switch (storage) {
    case "GOOGLE":
      return `https://storage.googleapis.com/${env.NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME}/${dataRef}`;
    case "SWARM":
      return `https://gateway.ethswarm.org/access/${dataRef}`;
    case "POSTGRES":
      return "#";
  }
};

const STORAGE_CONFIG: Record<BlobStorage, { icon: ReactNode; style: string }> =
  {
    GOOGLE: {
      icon: <GoogleIcon />,
      style:
        "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    },
    SWARM: {
      icon: <SwarmIcon />,
      style:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    },
    POSTGRES: {
      icon: <PostgresIcon />,
      style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
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
  const { icon, style } = STORAGE_CONFIG[storage];
  const ref = buildBlobDataRef(storage, dataRef);

  return (
    <NextLink href={ref} target={ref !== "#" ? "_blank" : "_self"}>
      <Badge
        className={style}
        icon={icon}
        label={capitalize(storage)}
        size={size}
      />
    </NextLink>
  );
};
