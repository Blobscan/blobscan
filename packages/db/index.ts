import { StatsAggregator } from "./StatsAggregator";
import { prisma } from "./prisma";

export * from "@prisma/client";

export * from "./utils/dates";

export const statsAggregator = new StatsAggregator(prisma);

export { prisma };
