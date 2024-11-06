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
  startTime: z.number().optional(),
  endTime: z.number().optional(),
});

const outputSchema = z.object({
  validatorIdx: z.bigint(),
  validatorPublicKey: z.string(),

  epochIdx: z.array(z.bigint()),
  aggEpochIdx: z.array(z.array(z.bigint())),
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
      input: { validatorKey, validatorIdx, validatorIsStr, startTime, endTime },
    }) => {
      if (startTime && endTime && startTime > endTime) {
        throw new Error("`startTime` must be less than or equal to `endTime`.");
      }

      const whereCondition: any = {
        OR: [
          { validatorPublicKey: validatorIsStr ? validatorKey : undefined },
          { validatorIdx: validatorIsStr ? undefined : BigInt(validatorIdx) },
        ],
      };

      // if (startTime && endTime) {
      //   whereCondition.insertedAt = {
      //     gte: new Date(startTime),
      //     lte: new Date(endTime),
      //   };
      // }

      let income = await prisma.validatorIncome.findMany({
        select: {
          epochIdx: true,
          incomeGWei: true,
          validatorPublicKey: true,
          validatorIdx: true,
          insertedAt: true,
        },
        where: whereCondition,
        orderBy: [{ id: "desc" }, { epochIdx: "asc" }],
        take: queryListLimit,
      });

      if (startTime && endTime) {
        income = income.filter(
          (item) => item.insertedAt >= new Date(startTime) && item.insertedAt <= new Date(endTime)
        );
      }

      for (let incomeIndex = 0; incomeIndex < income.length - 1; incomeIndex++) {
        const currentIncome = income[incomeIndex];
        const diff =
          (income[incomeIndex + 1]?.epochIdx as bigint) -
          (currentIncome?.epochIdx as bigint);
        if (diff > BigInt(1)) {
          const newEntriesCount = Number(diff) - 1;

          if (newEntriesCount > 0) {
            income.splice(
              incomeIndex + 1,
              0,
              ...Array.from(
                { length: newEntriesCount },
                (_, index) =>
                ({
                  epochIdx: (currentIncome?.epochIdx as bigint) + BigInt(index + 1),
                  incomeGWei: BigInt(0),
                  validatorIdx: income[0]?.validatorIdx || BigInt(0),
                  validatorPublicKey: income[0]?.validatorPublicKey || "",
                  insertedAt: new Date()
                })

              )
            );
          }

          incomeIndex += newEntriesCount;
        }
      }

      const epochIdx: bigint[] = [];
      const incomeGWei: bigint[] = [];
      // Aggregate data if startTime and endTime are provided
      const itemsToAggregate = Math.ceil(income.length / epochDisplayLimit);
      const shouldAggregate = Boolean(startTime && endTime && itemsToAggregate > 1);
      const aggregationInfo: bigint[][] = [];

      if (shouldAggregate) {
        let i = 0;
        while (i < income.length) {
          let sum = BigInt(0);
          const indices: bigint[] = [];

          for (let j = 0; j < itemsToAggregate && i < income.length; j++, i++) {
            const currentIncome = income[i];

            if (currentIncome) {
              sum += currentIncome.incomeGWei;
              indices.push(currentIncome.epochIdx);
              epochIdx.push(currentIncome.epochIdx);
            }
          }

          incomeGWei.push(sum);
          aggregationInfo.push(indices);
        }
      } else {
        for (let i = 0; i < income.length && i < epochDisplayLimit; i++) {
          const { epochIdx: idx, incomeGWei: incomeData } = income[i] as {
            validatorIdx: bigint;
            validatorPublicKey: string;
            epochIdx: bigint;
            incomeGWei: bigint;
            insertedAt: Date;
          };
          incomeGWei.push(incomeData);
          epochIdx.push(idx);
          aggregationInfo.push([idx]);
        }
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
        aggEpochIdx: aggregationInfo,
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
