import { Prisma } from "@prisma/client";

export type ZeroOpResult = { count: number }[];

export const helpersExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Helper Operations",
    model: {
      $allModels: {
        zero() {
          return prisma.$queryRaw<ZeroOpResult>`SELECT 0 as count`;
        },
      },
      block: {
        findLatest() {
          return prisma.block.findFirst({
            where: {
              transactionForks: {
                none: {},
              },
            },
            orderBy: { number: "desc" },
          });
        },
      },
    },
  })
);
