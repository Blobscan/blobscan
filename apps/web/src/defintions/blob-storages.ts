import type { BlobStorage } from "~/types";
import type { ResourceDefinition } from "~/types/definition";

export const STORAGE_DEFINITIONS: Record<
  BlobStorage,
  Omit<ResourceDefinition, "color">
> = {
  google: {
    name: "Google",
    badgeClassname:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-200",
  },
  swarm: {
    name: "Swarm",
    badgeClassname:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 dark:hover:text-orange-200",
  },
  swarmycloud: {
    name: "Swarm",
    badgeClassname:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 dark:hover:text-orange-200",
  },
  postgres: {
    name: "Postgres",
    badgeClassname:
      "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800",
  },
  weavevm: {
    name: "Load Network",
    badgeClassname:
      "bg-blue-300 text-gray-800 hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-blue-200",
  },
  s3: {
    name: "S3",
    badgeClassname:
      "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 hover:text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 dark:hover:text-yellow-200",
  },
};
