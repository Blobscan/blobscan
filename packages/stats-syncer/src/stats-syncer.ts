import { StatsSyncer } from "./StatsSyncer";
import { env } from "./env";

export const statsSyncer = env.STATS_SYNCER_ENABLED
  ? new StatsSyncer(env.REDIS_URI)
  : undefined;
