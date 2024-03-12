import type { ReactNode } from "react";
import React from "react";

import GoogleIcon from "~/icons/google.svg";
import PostgresIcon from "~/icons/postgres.svg";
import SwarmIcon from "~/icons/swarm.svg";
import Badge from "./Badge";

type RollupMapping = {
  [rollup: string]: ReactNode;
};

const rollupMapping: RollupMapping = {
  google: <Badge label="Google" icon={<GoogleIcon />} color="slate" />,
  swarm: <Badge label="Swarm" icon={<SwarmIcon />} color="orange" />,
  postgres: <Badge label="Postgres" icon={<PostgresIcon />} color="blue" />,
};

const StorageBadge = ({ storage }: { storage: string }) => {
  const badge = rollupMapping[storage.toLowerCase()];

  if (!badge) {
    return null;
  }

  return <div className="flex">{badge}</div>;
};

export default StorageBadge;
