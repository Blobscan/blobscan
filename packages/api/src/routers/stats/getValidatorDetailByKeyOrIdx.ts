import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const queryListLimit = 225 * 30;
const epochDisplayLimit = 225;
const epochDayAggLimit = 30;

// Cannot use z.union() method, it may cause errors.
// More Info: https://github.com/jlalmes/trpc-openapi/issues/255
const inputSchema = z.object({
  item: z.string(),
  validatorKey: z.string(),
  // BigInt cannot be used in Prisma as it may result in type errors.
  // More Info: https://github.com/prisma/prisma/discussions/9793
  validatorIdx: z.string(),
  validatorIsStr: z.boolean(),
});

const outputSchema = z.object({
  validatorIdx: z.bigint(),
  validatorPublicKey: z.string(),

  epochIdx: z.array(z.bigint()),
  incomeGWei: z.array(z.bigint()),

  incomeGweiDayAvg: z.array(z.number()),
  incomeGweiDayAvgDate: z.array(z.string()),
});

// export const getValidatorDetailByKeyOrIdx = publicProcedure
//   .meta({
//     openapi: {
//       method: "GET",
//       path: `/validator/{item}`,
//       tags: ["stats"],
//       summary: "Get validator rewards detail.",
//     },
//   })
//   .input(inputSchema)
//   .output(outputSchema)
//   .query(
//     async ({
//       ctx: { prisma },
//       input: { validatorKey, validatorIdx, validatorIsStr },
//     }) =>
//       prisma.validatorIncome
//         .findMany({
//           select: {
//             epochIdx: true,
//             incomeGWei: true,
//             validatorPublicKey: true,
//             validatorIdx: true,
//           },
//           where: {
//             OR: [
//               {
//                 validatorPublicKey: validatorIsStr ? validatorKey : undefined,
//               },
//               {
//                 validatorIdx: validatorIsStr ? undefined : BigInt(validatorIdx),
//               },
//             ],
//           },
//           orderBy: [{ id: "desc" }, { epochIdx: "asc" }],
//           take: QueryListLimit,
//         })
//         .then((income) =>
//           income.reduce<z.infer<typeof outputSchema>>(
//             (transformedIncome, currIncome) => {
//               transformedIncome.validatorIdx = currIncome.validatorIdx;
//               transformedIncome.validatorPublicKey =
//                 currIncome.validatorPublicKey;

//               return transformedIncome;
//             },
//             {
//               validatorIdx: BigInt(0),
//               validatorPublicKey: "",

//               epochIdx: [],
//               epochIdxDayAvg: [],

//               incomeGWei: [],
//               incomeGweiDayAvg: [],
//             }
//           )
//         )
//   );

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
      input: { validatorKey, validatorIdx, validatorIsStr },
    }) => {
      const income = await prisma.validatorIncome.findMany({
        select: {
          epochIdx: true,
          incomeGWei: true,
          validatorPublicKey: true,
          validatorIdx: true,
          insertedAt: true,
        },
        where: {
          OR: [
            { validatorPublicKey: validatorIsStr ? validatorKey : undefined },
            { validatorIdx: validatorIsStr ? undefined : BigInt(validatorIdx) },
          ],
        },
        orderBy: [{ id: "desc" }, { epochIdx: "asc" }],
        take: queryListLimit,
      });

      const epochIdx: bigint[] = [];
      const incomeGWei: bigint[] = [];
      for (let i = 0; i < income.length && i < epochDisplayLimit; i++) {
        const { epochIdx: idx, incomeGWei: incomeData } = income[i] as {
          validatorIdx: bigint;
          validatorPublicKey: string;
          epochIdx: bigint;
          incomeGWei: bigint;
          insertedAt: Date;
        };
        epochIdx.push(idx);
        incomeGWei.push(incomeData);
      }

      const dailyData = new Map<
        string,
        { totalIncome: bigint; count: number }
      >();
      income.forEach(({ incomeGWei, insertedAt }) => {
        const dateKey = new Date(insertedAt)
          .toISOString()
          .split("T")[0] as string;

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { totalIncome: BigInt(0), count: 0 });
        }
        const entry = dailyData.get(dateKey) as {
          totalIncome: bigint;
          count: number;
        };
        entry.totalIncome += incomeGWei;
        entry.count += 1;
      });

      const incomeGweiDate: string[] = [];
      const incomeGweiDayAvg: number[] = [];
      dailyData.forEach(({ totalIncome, count }, dateKey) => {
        incomeGweiDate.push(dateKey);
        incomeGweiDayAvg.push(Number(totalIncome) / count);
      });

      return {
        validatorIdx: income[0]?.validatorIdx || BigInt(0),
        validatorPublicKey: income[0]?.validatorPublicKey || "",
        epochIdx: epochIdx,
        incomeGWei: incomeGWei,

        incomeGweiDayAvg:
          incomeGweiDayAvg.length > epochDayAggLimit
            ? incomeGweiDayAvg.slice(0, epochDayAggLimit)
            : incomeGweiDayAvg,
        incomeGweiDayAvgDate:
          incomeGweiDate.length > epochDayAggLimit
            ? incomeGweiDate.slice(0, epochDayAggLimit)
            : incomeGweiDate,
      };
    }
  );
