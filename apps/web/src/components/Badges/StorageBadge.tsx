import type { ReactNode } from "react";
import React from "react";

import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import Badge from "./Badge";

type StorageToBadge = {
  [rollup: string]: ReactNode;
};

const STORAGE_BADGES: StorageToBadge = {
  google: <Badge label="Google" icon={<GoogleIcon />} color="slate" />,
  swarm: <Badge label="Swarm" icon={<SwarmIcon />} color="orange" />,
  postgres: <Badge label="Postgres" icon={<PostgresIcon />} color="blue" />,
};

const StorageBadge = ({ storage }: { storage: string }) => {
  const badge = STORAGE_BADGES[storage.toLowerCase()];

  return <div className="flex">{badge}</div>;
};

export default StorageBadge;
