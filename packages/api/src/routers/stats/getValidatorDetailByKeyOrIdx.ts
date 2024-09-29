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

  incomeGweiDaySum: z.array(z.number()),
  incomeGweiDaySumDate: z.array(z.string()),
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
        { totalIncome: bigint }
      >();
      income.forEach(({ incomeGWei, insertedAt }) => {
        const dateKey = new Date(insertedAt)
          .toISOString()
          .split("T")[0] as string;

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { totalIncome: BigInt(0) });
        }
        const entry = dailyData.get(dateKey) as {
          totalIncome: bigint;
        };
        entry.totalIncome += incomeGWei;
      });

      const incomeGweiDaySum: number[] = [];
      const incomeGweiDaySumDate: string[] = [];
      dailyData.forEach(({ totalIncome }, dateKey) => {
        incomeGweiDaySumDate.push(dateKey);
        incomeGweiDaySum.push(Number(totalIncome));
      });

      return {
        validatorIdx: income[0]?.validatorIdx || BigInt(0),
        validatorPublicKey: income[0]?.validatorPublicKey || "",
        epochIdx: epochIdx,
        incomeGWei: incomeGWei,

        incomeGweiDaySum:
          incomeGweiDaySum.length > epochDayAggLimit
            ? incomeGweiDaySum.slice(0, epochDayAggLimit)
            : incomeGweiDaySum,
        incomeGweiDaySumDate:
          incomeGweiDaySumDate.length > epochDayAggLimit
            ? incomeGweiDaySumDate.slice(0, epochDayAggLimit)
            : incomeGweiDaySumDate,
      };
    }
  );
