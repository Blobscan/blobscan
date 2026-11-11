import type { BlobStorage } from "~/types";
import type { ResourceDefinition } from "~/types/definition";

export const STORAGE_DEFINITIONS: Record<BlobStorage, ResourceDefinition> = {
  google: {
    name: "Google",
    color: { light: "#64748B", dark: "#CBD5E1" },
  },
  swarm: {
    name: "Swarm",
    color: { light: "#EA580C", dark: "#FDBA74" },
  },
  swarmycloud: {
    name: "Swarm",
    color: { light: "#EA580C", dark: "#FDBA74" },
  },
  postgres: {
    name: "Postgres",
    color: { light: "#2563EB", dark: "#93C5FD" },
  },
  weavevm: {
    name: "Load Network",
    color: { light: "#2563EB", dark: "#93C5FD" },
  },
  s3: {
    name: "S3",
    color: { light: "#CA8A04", dark: "#FDE047" },
  },
  ipfs: {
    name: "IPFS",
    color: { light: "#0D9488", dark: "#5EEAD4" },
  },
};
