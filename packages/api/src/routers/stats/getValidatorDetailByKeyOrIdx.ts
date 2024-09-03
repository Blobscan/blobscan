import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

// Cannot use z.union() method, it may cause errors.
// More Info: https://github.com/jlalmes/trpc-openapi/issues/255
const inputSchema = z.object({
  item: z.string(),
  validatorKey: z.string(),
  // BigInt cannot be used in Prisma as it may result in type errors.
  // More Info: https://github.com/prisma/prisma/discussions/9793
  validatorIdx: z.string(),
  validatorIsStr: z.boolean(),
  listLimit: z.number(),
});

const outputSchema = z.object({
  epochIdx: z.array(z.bigint()),
  incomeGWei: z.array(z.bigint()),
  validatorPublicKey: z.string(),
  validatorIdx: z.bigint(),
});

export const getValidatorDetailByKeyOrIdx = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/validator/{item}`,
      tags: ["stats"],
      summary: "Get validator rewards detail.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(
    async ({
      ctx: { prisma },
      input: { validatorKey, validatorIdx, validatorIsStr, listLimit },
    }) =>
      prisma.validatorIncome
        .findMany({
          select: {
            epochIdx: true,
            incomeGWei: true,
            validatorPublicKey: true,
            validatorIdx: true,
          },
          where: {
            OR: [
              {
                validatorPublicKey: validatorIsStr ? validatorKey : undefined,
              },
              {
                validatorIdx: validatorIsStr ? undefined : BigInt(validatorIdx),
              },
            ],
          },
          orderBy: [
            { id: 'desc' },
            { epochIdx: "asc" }
          ],
          take: listLimit,
        })
        .then((income) =>
          income.reduce<z.infer<typeof outputSchema>>(
            (transformedIncome, currIncome) => {
              transformedIncome.epochIdx.push(currIncome.epochIdx);
              transformedIncome.incomeGWei.push(currIncome.incomeGWei);
              transformedIncome.validatorPublicKey = currIncome.validatorPublicKey;
              transformedIncome.validatorIdx = currIncome.validatorIdx;

              return transformedIncome;
            },
            {
              epochIdx: [],
              incomeGWei: [],
              validatorPublicKey: "",
              validatorIdx: BigInt(0),
            }
          )
        )
  );
