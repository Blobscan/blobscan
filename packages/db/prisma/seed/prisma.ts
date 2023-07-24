import { PrismaClient } from "@prisma/client";

import { baseExtension, statsExtension } from "../extensions";

export function createLocalPrisma() {
  return new PrismaClient().$extends(baseExtension).$extends(statsExtension);
}
